import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { CatalogApi, type RecipeListQuery } from '@/data';
import { recipeKeys } from '@/shared/services';
import { useStore } from '@/state';

const PAGE_SIZE = 20;

/**
 * The recipes list, paged.
 *
 * The key deliberately excludes `page`: `useInfiniteQuery` owns paging, so
 * every page of one filtered list shares a single cache entry and scrolling
 * back does not refetch what is already held.
 */
export const useGetRecipes = (filters: Omit<RecipeListQuery, 'page' | 'limit'> = {}) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useInfiniteQuery({
        queryKey: recipeKeys.recipes(filters),
        queryFn: ({ pageParam }) => CatalogApi.getRecipes({ ...filters, page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: last => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
        enabled: isAuthenticated,
    });
};

/** Single recipe with ingredients and steps. */
export const useGetRecipe = (id: string) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: recipeKeys.recipe(id),
        queryFn: () => CatalogApi.getRecipe(id),
        enabled: isAuthenticated && Boolean(id),
    });
};

/** Everything the filter sheet offers; changes rarely, so it stays fresh. */
export const useGetRecipeFilters = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: recipeKeys.filters(),
        queryFn: () => CatalogApi.getRecipeFilters(),
        enabled: isAuthenticated,
        staleTime: 30 * 60_000,
    });
};
