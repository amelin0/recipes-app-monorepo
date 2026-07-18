import { useMemo } from 'react';

import { router } from 'expo-router';

import { useStore } from '@/state';
import { selectVisibleShoppingItems, type ShoppingListItem } from '@/state/domains/shopping-list';

import { SHOPPING_CATEGORY_ORDER } from '../shopping.constants';

export interface ShoppingCategoryGroup {
    categoryKey: string;
    items: ShoppingListItem[];
}

export const useShoppingListScreen = () => {
    const shoppingItems = useStore(state => state.shoppingItems);
    const addFromPlan = useStore(state => state.addFromPlan);
    const switchAddFromPlan = useStore(state => state.switchAddFromPlan);
    const toggleShoppingItem = useStore(state => state.toggleShoppingItem);

    const groups = useMemo<ShoppingCategoryGroup[]>(() => {
        const visible = selectVisibleShoppingItems({ shoppingItems, addFromPlan });
        const byCategory = new Map<string, ShoppingListItem[]>();
        visible.forEach(item => {
            const list = byCategory.get(item.categoryKey) ?? [];
            list.push(item);
            byCategory.set(item.categoryKey, list);
        });
        // Відомі категорії — у фіксованому порядку, невідомі — в кінці.
        const known = SHOPPING_CATEGORY_ORDER.filter(key => byCategory.has(key));
        const unknown = [...byCategory.keys()].filter(key => !SHOPPING_CATEGORY_ORDER.includes(key));
        return [...known, ...unknown].map(categoryKey => ({
            categoryKey,
            items: byCategory.get(categoryKey) ?? [],
        }));
    }, [shoppingItems, addFromPlan]);

    return {
        groups,
        isEmpty: groups.length === 0,
        addFromPlan,
        switchAddFromPlan,
        toggleShoppingItem,
        handleAddProduct: () => router.push('/(app)/add-product'),
    };
};
