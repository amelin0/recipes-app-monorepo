import { useQuery } from '@tanstack/react-query';

import { ShoppingListApi } from '@/data';
import { shoppingListKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * The list for a range of days.
 *
 * It is summed from the plan on every read rather than stored, so the range
 * is what decides its contents — a different window is a different list, not
 * a filtered view of one.
 */
export const useGetShoppingList = (from: string, to: string) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: shoppingListKeys.list(from, to),
        queryFn: () => ShoppingListApi.getList(from, to),
        enabled: isAuthenticated && Boolean(from) && Boolean(to),
        staleTime: 30_000,
    });
};
