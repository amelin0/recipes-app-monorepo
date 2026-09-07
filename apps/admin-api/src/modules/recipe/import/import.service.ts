import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { AdminRecipeRepository, ProductRepository, ReferenceRepository } from '@dns/database';

import { RecipeErrorCode } from '../recipe.errors';
import { AdminRecipeService } from '../recipe.service';

import { CsvFormatError, ParsedRecipeRow, RowError, parseRecipeCsv } from './csv.parser';

export interface ImportReport {
    created: number;
    updated: number;
    skipped: number;
    errors: RowError[];
}

@Injectable()
export class RecipeImportService {
    private readonly logger = new Logger(RecipeImportService.name);

    constructor(
        private readonly recipeRepository: AdminRecipeRepository,
        private readonly recipeService: AdminRecipeService,
        private readonly productRepository: ProductRepository,
        private readonly referenceRepository: ReferenceRepository,
    ) {}

    /**
     * Imports a CSV of authored recipes.
     *
     * **One transaction per recipe, not per file.** A row that fails is rolled
     * back alone and the rest of the file continues (FR-003) — the alternative
     * would discard 499 good recipes because of the 500th, which is how an
     * editor learns to stop using the import.
     */
    async import(csv: string, maxRows: number): Promise<ImportReport> {
        let parsed;
        try {
            parsed = parseRecipeCsv(csv);
        } catch (error) {
            // A broken file is not a broken row: reporting it per-row would
            // send someone hunting through a file that is wrong as a whole.
            throw new UnprocessableEntityException({
                message: error instanceof CsvFormatError ? error.message : 'The file could not be read as CSV',
                code: RecipeErrorCode.BadImportFile,
            });
        }

        if (parsed.rows.length > maxRows) {
            throw new UnprocessableEntityException({
                message: `The file has ${parsed.rows.length} rows; the limit is ${maxRows}`,
                code: RecipeErrorCode.BadImportFile,
            });
        }

        const dictionaries = await this.loadDictionaries();
        const products = await this.loadProductIndex();

        const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [...parsed.errors] };
        report.skipped = parsed.errors.length;

        for (const row of parsed.rows) {
            try {
                const existingId = await this.recipeRepository.findIdByImportKey(row.importKey);
                const payload = this.toPayload(row, dictionaries, products);

                if (existingId) {
                    await this.recipeService.update(existingId, payload);
                    report.updated++;
                } else {
                    await this.recipeService.create(payload);
                    report.created++;
                }
            } catch (error) {
                report.skipped++;
                report.errors.push({
                    row: row.row,
                    importKey: row.importKey,
                    message: this.explain(error),
                });
                this.logger.warn({ msg: 'recipe import row failed', row: row.row, importKey: row.importKey });
            }
        }

        return report;
    }

    /**
     * Resolves a parsed row into the same payload the manual form posts.
     *
     * Deliberately the same path: an imported dish and a hand-made one must be
     * indistinguishable afterwards, including the derived macros, and two
     * write paths would drift on exactly that.
     */
    private toPayload(
        row: ParsedRecipeRow,
        dictionaries: Dictionaries,
        products: Map<string, string>,
    ): Parameters<AdminRecipeService['create']>[0] {
        const categoryId = this.lookupSlug(dictionaries.categories, row.categorySlug, 'category');
        const cuisineId = this.lookupSlug(dictionaries.cuisines, row.cuisineSlug, 'cuisine');

        const dietIds = row.dietSlugs.map(slug => {
            const id = dictionaries.diets.get(slug);
            if (!id) throw new Error(`Unknown diet "${slug}"`);
            return id;
        });

        const ingredients = row.ingredients.map(line => {
            const productId = products.get(line.productName.toLowerCase());
            // FR-005: the import never invents a product. One without macros
            // would make the dish uncountable, and the failure would surface
            // as a wrong number on somebody's phone weeks later instead of
            // here, where it can be fixed in the file.
            if (!productId) throw new Error(`Product "${line.productName}" is not in the catalogue`);

            return { productId, amountG: line.amountG };
        });

        return {
            importKey: row.importKey,
            categoryId,
            cuisineId,
            dietIds,
            photoUrl: row.photoUrl,
            servings: row.servings,
            cookTimeMinutes: row.cookTimeMinutes,
            translations: row.titles,
            ingredients,
            // Steps arrive without ingredient chips: CSV cannot express «step 2
            // uses the 250 g of tomatoes» without becoming a second format
            // inside the first. Chips are added in the form, where they are
            // actually used.
            steps: row.steps.map((step, index) => ({
                stepNumber: index + 1,
                durationMinutes: step.durationMinutes,
                translations: step.translations.map(t => ({ ...t, description: null })),
                ingredientIndexes: [],
            })),
        };
    }

    private lookupSlug(index: Map<string, string>, slug: string | null, label: string): string | null {
        if (!slug) return null;

        const id = index.get(slug);
        if (!id) throw new Error(`Unknown ${label} "${slug}"`);

        return id;
    }

    private async loadDictionaries(): Promise<Dictionaries> {
        const [categories, cuisines, diets] = await Promise.all([
            this.referenceRepository.categories(DEFAULT_LANGUAGE),
            this.referenceRepository.cuisines(DEFAULT_LANGUAGE),
            this.referenceRepository.diets(DEFAULT_LANGUAGE),
        ]);

        const index = (rows: { id: string; slug: string }[]): Map<string, string> =>
            new Map(rows.map(row => [row.slug, row.id]));

        return { categories: index(categories), cuisines: index(cuisines), diets: index(diets) };
    }

    /**
     * Every global product keyed by its lower-cased English name, loaded once.
     *
     * A lookup per ingredient would be N+1 against a file of five hundred
     * dishes — the difference between the sixty seconds SC-001 allows and
     * several minutes.
     */
    private async loadProductIndex(): Promise<Map<string, string>> {
        const page = await this.productRepository.searchGlobal({ language: 'en', page: 1, limit: 10_000 });
        return new Map(page.items.map(product => [product.name.toLowerCase(), product.id]));
    }

    /** Nest exceptions carry their message inside the response object. */
    private explain(error: unknown): string {
        if (error instanceof Error) {
            const response = (error as { response?: { message?: string } }).response;
            return response?.message ?? error.message;
        }
        return String(error);
    }
}

interface Dictionaries {
    categories: Map<string, string>;
    cuisines: Map<string, string>;
    diets: Map<string, string>;
}
