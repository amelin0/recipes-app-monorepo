import { CsvFormatError, parseCsv, parseRecipeCsv } from '../src/modules/recipe/import/csv.parser';

/**
 * The parser touches no database, so this file is pure unit tests — it lives
 * in the db suite only because admin-api has one jest config, and a second one
 * for four hundred milliseconds of work is not worth the file.
 */

const HEADER =
    'import_key,title_uk,title_en,category,cuisine,diets,servings,cook_time_minutes,ingredients,steps_uk,steps_en,step_durations';

const row = (cells: Partial<Record<string, string>>): string =>
    [
        cells.import_key ?? 'greek-salad',
        cells.title_uk ?? 'Грецький салат',
        cells.title_en ?? 'Greek salad',
        cells.category ?? 'salads',
        cells.cuisine ?? 'greek',
        cells.diets ?? 'vegetarian;gluten-free',
        cells.servings ?? '2',
        cells.cook_time_minutes ?? '15',
        cells.ingredients ?? 'Tomatoes:250;Feta:120',
        cells.steps_uk ?? 'Наріжте овочі|Додайте фету',
        cells.steps_en ?? 'Chop the vegetables|Add the feta',
        cells.step_durations ?? '8;3',
    ].join(',');

const file = (...rows: string[]): string => [HEADER, ...rows].join('\n');

describe('csv reader', () => {
    it('keeps a comma inside a quoted field', () => {
        const table = parseCsv('a,b\n"one, two",three');
        expect(table[1]).toEqual(['one, two', 'three']);
    });

    it('keeps a newline inside a quoted field', () => {
        const table = parseCsv('a,b\n"line one\nline two",three');
        expect(table[1]).toEqual(['line one\nline two', 'three']);
    });

    it('unescapes a doubled quote', () => {
        const table = parseCsv('a\n"she said ""yes"""');
        expect(table[1]).toEqual(['she said "yes"']);
    });

    it('drops the BOM Excel writes, so the first header still matches', () => {
        const table = parseCsv('﻿import_key,title_uk\nx,y');
        expect(table[0]?.[0]).toBe('import_key');
    });

    it('ignores blank lines', () => {
        const table = parseCsv('a,b\n\n1,2\n\n');
        expect(table).toHaveLength(2);
    });
});

describe('recipe csv', () => {
    it('reads a full row', () => {
        const { rows, errors } = parseRecipeCsv(file(row({})));

        expect(errors).toHaveLength(0);
        expect(rows).toHaveLength(1);

        const recipe = rows[0]!;
        expect(recipe.importKey).toBe('greek-salad');
        expect(recipe.titles).toEqual([
            { language: 'uk', title: 'Грецький салат' },
            { language: 'en', title: 'Greek salad' },
        ]);
        expect(recipe.dietSlugs).toEqual(['vegetarian', 'gluten-free']);
        expect(recipe.ingredients).toEqual([
            { productName: 'Tomatoes', amountG: 250 },
            { productName: 'Feta', amountG: 120 },
        ]);
        expect(recipe.steps).toHaveLength(2);
        expect(recipe.steps[0]?.durationMinutes).toBe(8);
    });

    it('cites the row number an editor sees in the spreadsheet', () => {
        const { errors } = parseRecipeCsv(file(row({}), row({ import_key: 'x', servings: 'many' })));

        // Header is row 1, so the second data row is row 3.
        expect(errors[0]?.row).toBe(3);
    });

    it('rejects one row without touching the others', () => {
        const { rows, errors } = parseRecipeCsv(
            file(row({}), row({ import_key: 'broken', ingredients: 'Tomatoes' }), row({ import_key: 'third' })),
        );

        expect(rows.map(r => r.importKey)).toEqual(['greek-salad', 'third']);
        expect(errors).toHaveLength(1);
        expect(errors[0]?.importKey).toBe('broken');
        expect(errors[0]?.message).toMatch(/name:grams/);
    });

    it('catches a key repeated inside one file', () => {
        const { rows, errors } = parseRecipeCsv(file(row({}), row({ title_uk: 'Інша' })));

        // Otherwise the second row would update what the first just created,
        // which reads as success and quietly loses a recipe.
        expect(rows).toHaveLength(1);
        expect(errors[0]?.message).toMatch(/Duplicate import_key/);
    });

    it('refuses a step list whose translations do not line up', () => {
        const { errors } = parseRecipeCsv(file(row({ steps_en: 'Only one step' })));
        expect(errors[0]?.message).toMatch(/steps_en has 1 steps but steps_uk has 2/);
    });

    it('refuses durations that do not line up with the steps', () => {
        const { errors } = parseRecipeCsv(file(row({ step_durations: '8;3;5' })));
        expect(errors[0]?.message).toMatch(/step_durations has 3 values/);
    });

    it('accepts a row with only the required columns filled in', () => {
        const { rows, errors } = parseRecipeCsv(
            file(
                row({
                    title_en: '',
                    category: '',
                    cuisine: '',
                    diets: '',
                    cook_time_minutes: '',
                    steps_uk: '',
                    steps_en: '',
                    step_durations: '',
                }),
            ),
        );

        expect(errors).toHaveLength(0);
        expect(rows[0]?.titles).toHaveLength(1);
        expect(rows[0]?.steps).toHaveLength(0);
        expect(rows[0]?.cuisineSlug).toBeNull();
    });

    it('splits an ingredient on its last colon, so a name may contain one', () => {
        const { rows } = parseRecipeCsv(file(row({ ingredients: 'Sauce: tomato:200' })));
        expect(rows[0]?.ingredients).toEqual([{ productName: 'Sauce: tomato', amountG: 200 }]);
    });

    it('rejects a non-positive amount', () => {
        const { errors } = parseRecipeCsv(file(row({ ingredients: 'Tomatoes:0' })));
        expect(errors[0]?.message).toMatch(/positive amount in grams/);
    });

    describe('whole-file failures', () => {
        it('throws when a required column is absent', () => {
            expect(() => parseRecipeCsv('title_uk,servings\nx,2')).toThrow(CsvFormatError);
        });

        it('throws on a header with no rows', () => {
            expect(() => parseRecipeCsv(HEADER)).toThrow(/no rows/);
        });

        it('throws on an empty file', () => {
            expect(() => parseRecipeCsv('')).toThrow(/empty/);
        });
    });
});
