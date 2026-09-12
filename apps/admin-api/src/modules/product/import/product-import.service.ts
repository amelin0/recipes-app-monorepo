import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';

import { Language } from '@dns/shared-types';
import { adminCreateProductSchema } from '@dns/validation';

import { CsvFormatError, RowError, parseCsv } from '../../recipe/import/csv.parser';
import { ProductErrorCode } from '../product.errors';
import { AdminProductService } from '../product.service';

export interface ProductImportReport {
    created: number;
    updated: number;
    skipped: number;
    errors: RowError[];
}

const REQUIRED_COLUMNS = ['name_en', 'name_uk', 'calories', 'protein', 'fats', 'carbs'] as const;

@Injectable()
export class ProductImportService {
    private readonly logger = new Logger(ProductImportService.name);

    constructor(private readonly productService: AdminProductService) {}

    /**
     * Imports a CSV of products.
     *
     * Same shape as the recipe import, and deliberately the same reader: one
     * transaction per row, a report rather than an exception for a bad row,
     * and `200` even with errors, because partial success is the expected
     * outcome of a file a human typed.
     *
     * Deduplicated on the **English name** of **global** products. Unlike
     * recipes, products need no invented key: English is already the
     * identity, because that is what a recipe CSV addresses them by
     * (`Tomatoes:250`). Private products are outside the catalogue and
     * outside the match.
     */
    async import(csv: string, maxRows: number): Promise<ProductImportReport> {
        const table = parseCsv(csv);

        if (table.length === 0) {
            throw this.badFile('The file is empty');
        }

        const header = (table[0] as string[]).map(cell => cell.trim().toLowerCase());
        const missing = REQUIRED_COLUMNS.filter(column => !header.includes(column));
        if (missing.length > 0) {
            throw this.badFile(`Missing required columns: ${missing.join(', ')}`);
        }

        if (table.length === 1) {
            throw this.badFile('The file has a header but no rows');
        }

        if (table.length - 1 > maxRows) {
            throw this.badFile(`The file has ${table.length - 1} rows; the limit is ${maxRows}`);
        }

        const report: ProductImportReport = { created: 0, updated: 0, skipped: 0, errors: [] };
        const seen = new Set<string>();

        for (let index = 1; index < table.length; index++) {
            // Spreadsheet rows are 1-based and the header is row 1, so this is
            // the number the editor sees in Excel.
            const rowNumber = index + 1;
            const cells = table[index] as string[];
            const get = (column: string): string => {
                const position = header.indexOf(column);
                return position === -1 ? '' : (cells[position] ?? '').trim();
            };

            const nameEn = get('name_en');

            try {
                if (!nameEn) throw new Error('name_en is required');

                // Caught here rather than at the database: two rows of one file
                // would otherwise have the second update what the first just
                // created, which reads as success and loses a row.
                const key = nameEn.toLowerCase();
                if (seen.has(key)) throw new Error(`Duplicate name_en "${nameEn}" in this file`);
                seen.add(key);

                // One call decides «update or create» and writes, in one
                // transaction and only ever against the global catalogue — a
                // user's private product of the same name is not the row the
                // file means, and must come out of the import untouched.
                const outcome = await this.productService.importRow(this.toPayload(get, nameEn));
                report[outcome]++;
            } catch (error) {
                report.skipped++;
                report.errors.push({ row: rowNumber, importKey: nameEn || null, message: this.explain(error) });
                this.logger.warn({ msg: 'product import row failed', row: rowNumber, nameEn });
            }
        }

        return report;
    }

    /**
     * Validated through the same schema the form posts through.
     *
     * That is the point: an imported product and a hand-made one must be
     * indistinguishable afterwards, including which numbers are refused. Two
     * validation paths would drift on exactly the rows that matter — the
     * implausible ones.
     */
    private toPayload(get: (column: string) => string, nameEn: string): ReturnType<typeof adminCreateProductSchema.parse> {
        const parsed = adminCreateProductSchema.safeParse({
            groupSlug: get('group') || null,
            caloriesPer100g: this.number(get('calories'), 'calories'),
            proteinPer100g: this.number(get('protein'), 'protein'),
            fatsPer100g: this.number(get('fats'), 'fats'),
            carbsPer100g: this.number(get('carbs'), 'carbs'),
            servingWeightG: get('serving_weight_g') ? this.number(get('serving_weight_g'), 'serving_weight_g') : null,
            isQuickPick: get('quick_pick').toLowerCase() === 'true',
            translations: [
                { language: Language.Ukrainian, name: get('name_uk'), servingLabel: get('serving_label_uk') || null },
                { language: Language.English, name: nameEn, servingLabel: get('serving_label_en') || null },
            ],
        });

        if (!parsed.success) {
            throw new Error(parsed.error.issues.map(issue => issue.message).join('; '));
        }

        return parsed.data;
    }

    private number(raw: string, column: string): number {
        const value = Number(raw);
        if (!Number.isFinite(value)) throw new Error(`${column} must be a number, got "${raw}"`);
        return value;
    }

    private badFile(message: string): UnprocessableEntityException {
        // A broken file is not a broken row: reporting it per-row would send
        // someone hunting through a file that is wrong as a whole.
        return new UnprocessableEntityException({ message, code: ProductErrorCode.BadImportFile });
    }

    /** Nest exceptions carry their message inside the response object. */
    private explain(error: unknown): string {
        if (error instanceof CsvFormatError) return error.message;
        if (error instanceof Error) {
            const response = (error as { response?: { message?: string } }).response;
            return response?.message ?? error.message;
        }
        return String(error);
    }
}
