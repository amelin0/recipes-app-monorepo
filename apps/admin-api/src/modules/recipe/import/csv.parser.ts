/**
 * A small RFC-4180 reader and the row shape the recipe import expects.
 *
 * Hand-written rather than a dependency: the format is one table with quoted
 * fields, the whole reader is forty lines, and a parser we own is one we can
 * point at when a chef-editor's export does something surprising.
 *
 * Nothing here touches the database. That is the point — the parser is the
 * half of the import that can be tested exhaustively without one.
 */

import { Language } from '@dns/shared-types';

export const REQUIRED_COLUMNS = ['import_key', 'title_uk', 'servings', 'ingredients'] as const;

export interface ParsedIngredient {
    /** English product name, matched against the catalogue. Never created. */
    productName: string;
    amountG: number;
}

export interface ParsedRecipeRow {
    /** 1-based line number in the file, header included — what the error report cites. */
    row: number;
    importKey: string;
    titles: { language: Language; title: string }[];
    categorySlug: string | null;
    cuisineSlug: string | null;
    dietSlugs: string[];
    servings: number;
    cookTimeMinutes: number | null;
    photoUrl: string | null;
    ingredients: ParsedIngredient[];
    steps: { translations: { language: Language; title: string }[]; durationMinutes: number | null }[];
}

export interface RowError {
    row: number;
    importKey: string | null;
    message: string;
}

export interface ParseResult {
    rows: ParsedRecipeRow[];
    errors: RowError[];
}

export class CsvFormatError extends Error {}

/**
 * Splits CSV text into cells.
 *
 * Quoted fields may contain commas, newlines and doubled quotes — all three
 * appear in real recipe text, and a `split(',')` would silently truncate a
 * description at its first comma.
 */
export function parseCsv(text: string): string[][] {
    // A BOM is what Excel writes by default, and left in place it becomes part
    // of the first header name — so `import_key` silently stops matching.
    const input = text.replace(/^\uFEFF/, '');

    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < input.length; index++) {
        const char = input[index];

        if (quoted) {
            if (char === '"') {
                if (input[index + 1] === '"') {
                    field += '"';
                    index++;
                } else {
                    quoted = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            quoted = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (char !== '\r') {
            field += char;
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter(cells => cells.some(cell => cell.trim() !== ''));
}

/**
 * Turns CSV text into recipe rows, collecting per-row problems rather than
 * stopping at the first (FR-003).
 *
 * A malformed **file** still throws: missing headers or no data rows is not a
 * problem with row 14, and reporting it as one would send an editor hunting
 * through a file that is wrong as a whole.
 */
export function parseRecipeCsv(text: string): ParseResult {
    const table = parseCsv(text);

    if (table.length === 0) {
        throw new CsvFormatError('The file is empty');
    }

    const header = (table[0] as string[]).map(cell => cell.trim().toLowerCase());
    const missing = REQUIRED_COLUMNS.filter(column => !header.includes(column));

    if (missing.length > 0) {
        throw new CsvFormatError(`Missing required columns: ${missing.join(', ')}`);
    }

    if (table.length === 1) {
        throw new CsvFormatError('The file has a header but no rows');
    }

    const rows: ParsedRecipeRow[] = [];
    const errors: RowError[] = [];
    const seen = new Set<string>();

    for (let index = 1; index < table.length; index++) {
        // +1 because spreadsheet rows are 1-based and the header is row 1 —
        // the number has to be the one the editor sees in Excel.
        const rowNumber = index + 1;
        const cells = table[index] as string[];
        const get = (column: string): string => {
            const position = header.indexOf(column);
            return position === -1 ? '' : (cells[position] ?? '').trim();
        };

        const importKey = get('import_key');

        try {
            if (!importKey) throw new Error('import_key is required');

            // Caught here rather than at the unique index: two rows of one
            // file would otherwise have the second one update what the first
            // just created, which reads as success and loses data.
            if (seen.has(importKey)) throw new Error(`Duplicate import_key "${importKey}" in this file`);
            seen.add(importKey);

            rows.push(parseRow(rowNumber, importKey, get));
        } catch (error) {
            errors.push({
                row: rowNumber,
                importKey: importKey || null,
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return { rows, errors };
}

function parseRow(row: number, importKey: string, get: (column: string) => string): ParsedRecipeRow {
    const titleUk = get('title_uk');
    if (!titleUk) throw new Error('title_uk is required');

    const servings = parseInt(get('servings'), 10);
    if (!Number.isInteger(servings) || servings <= 0) throw new Error('servings must be a positive whole number');

    const titles = [{ language: Language.Ukrainian, title: titleUk }];
    const titleEn = get('title_en');
    if (titleEn) titles.push({ language: Language.English, title: titleEn });

    const stepsUk = splitList(get('steps_uk'), '|');
    const stepsEn = splitList(get('steps_en'), '|');

    if (stepsEn.length > 0 && stepsEn.length !== stepsUk.length) {
        throw new Error(`steps_en has ${stepsEn.length} steps but steps_uk has ${stepsUk.length}`);
    }

    const durations = splitList(get('step_durations'), ';').map(value => {
        const minutes = parseInt(value, 10);
        if (!Number.isInteger(minutes) || minutes <= 0) throw new Error(`Invalid step duration: "${value}"`);
        return minutes;
    });

    if (durations.length > 0 && durations.length !== stepsUk.length) {
        throw new Error(`step_durations has ${durations.length} values but there are ${stepsUk.length} steps`);
    }

    return {
        row,
        importKey,
        titles,
        categorySlug: get('category') || null,
        cuisineSlug: get('cuisine') || null,
        dietSlugs: splitList(get('diets'), ';'),
        servings,
        cookTimeMinutes: optionalInt(get('cook_time_minutes'), 'cook_time_minutes'),
        photoUrl: get('photo_url') || null,
        ingredients: parseIngredients(get('ingredients')),
        steps: stepsUk.map((title, index) => {
            const translations = [{ language: Language.Ukrainian, title }];
            const english = stepsEn[index];
            if (english) translations.push({ language: Language.English, title: english });

            return { translations, durationMinutes: durations[index] ?? null };
        }),
    };
}

/** `Tomatoes:250;Feta:120` — English product name, colon, grams. */
function parseIngredients(raw: string): ParsedIngredient[] {
    const parts = splitList(raw, ';');
    if (parts.length === 0) throw new Error('ingredients is required');

    return parts.map(part => {
        // lastIndexOf, not indexOf: a product name may legitimately contain a
        // colon, and only the last one separates it from the amount.
        const separator = part.lastIndexOf(':');
        if (separator === -1) throw new Error(`Ingredient "${part}" must be written as name:grams`);

        const productName = part.slice(0, separator).trim();
        const amountG = Number(part.slice(separator + 1).trim());

        if (!productName) throw new Error(`Ingredient "${part}" has no product name`);
        if (!Number.isFinite(amountG) || amountG <= 0) {
            throw new Error(`Ingredient "${productName}" must have a positive amount in grams`);
        }

        return { productName, amountG };
    });
}

function splitList(raw: string, separator: string): string[] {
    return raw
        .split(separator)
        .map(value => value.trim())
        .filter(value => value.length > 0);
}

function optionalInt(raw: string, column: string): number | null {
    if (!raw) return null;

    const value = parseInt(raw, 10);
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${column} must be a positive whole number`);

    return value;
}
