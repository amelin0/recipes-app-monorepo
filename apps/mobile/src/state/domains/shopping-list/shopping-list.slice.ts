import type { StateCreator } from 'zustand';

export type ShoppingAmountUnit = 'g' | 'ml';

export interface ShoppingListItem {
    id: string;
    /** Catalog key — label lives in `shopping:products.*`. */
    productKey: string;
    /** Group key — label lives in `shopping:categories.*`. */
    categoryKey: string;
    kcal: number;
    amount: number;
    unit: ShoppingAmountUnit;
    checked: boolean;
    /** Imported from the meal plan (hidden while «Додати з плану» is off). */
    fromPlan: boolean;
}

export type NewShoppingItem = Omit<ShoppingListItem, 'id' | 'checked' | 'fromPlan'>;

// TODO: replace with GET /shopping-list once the API ships. Mirrors the
// «Список - на тиждень» Figma mock (435:16318).
const MOCK_PLAN_ITEMS: ShoppingListItem[] = [
    {
        id: 'plan-1',
        productKey: 'chicken-fillet',
        categoryKey: 'meat',
        kcal: 75,
        amount: 1249,
        unit: 'g',
        checked: true,
        fromPlan: true,
    },
    {
        id: 'plan-2',
        productKey: 'beef',
        categoryKey: 'meat',
        kcal: 133,
        amount: 890,
        unit: 'g',
        checked: true,
        fromPlan: true,
    },
    {
        id: 'plan-3',
        productKey: 'pork',
        categoryKey: 'meat',
        kcal: 48,
        amount: 80,
        unit: 'g',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-4',
        productKey: 'turkey',
        categoryKey: 'meat',
        kcal: 72,
        amount: 1592,
        unit: 'g',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-5',
        productKey: 'lamb',
        categoryKey: 'meat',
        kcal: 33,
        amount: 55,
        unit: 'g',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-6',
        productKey: 'wheat-flour',
        categoryKey: 'flour',
        kcal: 110,
        amount: 248,
        unit: 'g',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-7',
        productKey: 'corn-flour',
        categoryKey: 'flour',
        kcal: 130,
        amount: 242,
        unit: 'g',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-8',
        productKey: 'kefir',
        categoryKey: 'dairy',
        kcal: 110,
        amount: 245,
        unit: 'ml',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-9',
        productKey: 'milk',
        categoryKey: 'dairy',
        kcal: 55,
        amount: 165,
        unit: 'ml',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-10',
        productKey: 'sour-cream',
        categoryKey: 'dairy',
        kcal: 160,
        amount: 115,
        unit: 'ml',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-11',
        productKey: 'cottage-cheese',
        categoryKey: 'dairy',
        kcal: 41,
        amount: 125,
        unit: 'ml',
        checked: false,
        fromPlan: true,
    },
    {
        id: 'plan-12',
        productKey: 'butter',
        categoryKey: 'dairy',
        kcal: 59,
        amount: 215,
        unit: 'ml',
        checked: false,
        fromPlan: true,
    },
];

export interface ShoppingListSlice {
    shoppingItems: ShoppingListItem[];
    /** «Додати з плану» — auto-import products from the meal plan. */
    addFromPlan: boolean;
    toggleShoppingItem: (id: string) => void;
    switchAddFromPlan: (value: boolean) => void;
    addShoppingItem: (item: NewShoppingItem) => void;
    /** Back to the initial state — wired into the global store reset (logout). */
    resetShoppingList: () => void;
}

/** Items visible with the current «Додати з плану» setting. */
export const selectVisibleShoppingItems = (slice: Pick<ShoppingListSlice, 'shoppingItems' | 'addFromPlan'>) =>
    slice.addFromPlan ? slice.shoppingItems : slice.shoppingItems.filter(item => !item.fromPlan);

export const createShoppingListSlice: StateCreator<ShoppingListSlice, [], [], ShoppingListSlice> = set => ({
    shoppingItems: MOCK_PLAN_ITEMS,
    addFromPlan: true,

    toggleShoppingItem: id =>
        set(state => ({
            shoppingItems: state.shoppingItems.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item,
            ),
        })),

    switchAddFromPlan: value => set(() => ({ addFromPlan: value })),

    addShoppingItem: item =>
        set(state => {
            // Той самий продукт, доданий вручну повторно, зливаємо в один рядок.
            const existing = state.shoppingItems.find(
                candidate =>
                    !candidate.fromPlan && candidate.productKey === item.productKey && candidate.unit === item.unit,
            );
            if (existing) {
                return {
                    shoppingItems: state.shoppingItems.map(candidate =>
                        candidate.id === existing.id
                            ? {
                                  ...candidate,
                                  amount: candidate.amount + item.amount,
                                  kcal: candidate.kcal + item.kcal,
                                  checked: false,
                              }
                            : candidate,
                    ),
                };
            }
            return {
                shoppingItems: [
                    ...state.shoppingItems,
                    { ...item, id: `manual-${Date.now()}`, checked: false, fromPlan: false },
                ],
            };
        }),

    resetShoppingList: () => set(() => ({ shoppingItems: MOCK_PLAN_ITEMS, addFromPlan: true })),
});
