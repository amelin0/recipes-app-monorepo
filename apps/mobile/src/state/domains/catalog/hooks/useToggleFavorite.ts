import { useMutation } from '@tanstack/react-query';

import { CatalogApi, type Paginated, type RecipeCard, type RecipeDetail } from '@/data';
import { queryClient, Queries, recipeKeys } from '@/shared/services';

interface ToggleFavoriteVariables {
    id: string;
    /** The state the card is in now; the call flips it. */
    isFavorite: boolean;
}

/** Rewrites the flag wherever this recipe is already cached — list pages and detail. */
const writeFavorite = (id: string, isFavorite: boolean) => {
    queryClient.setQueriesData<{ pages: Paginated<RecipeCard>[] } | undefined>(
        { queryKey: [Queries.Recipes] },
        current =>
            current && {
                ...current,
                pages: current.pages.map(page => ({
                    ...page,
                    data: page.data.map(card => (card.id === id ? { ...card, isFavorite } : card)),
                })),
            },
    );

    queryClient.setQueryData<RecipeDetail | undefined>(
        recipeKeys.recipe(id),
        current => current && { ...current, isFavorite },
    );
};

/**
 * The heart. Optimistic, because the tap has to fill instantly — and because
 * the «Обране» tab is a filtered read of the same list, a failure has to put
 * the card back rather than leave it in a tab it does not belong to.
 */
export const useToggleFavorite = () =>
    useMutation({
        mutationFn: ({ id, isFavorite }: ToggleFavoriteVariables) =>
            isFavorite ? CatalogApi.removeFavorite(id) : CatalogApi.addFavorite(id),

        onMutate: async ({ id, isFavorite }: ToggleFavoriteVariables) => {
            await queryClient.cancelQueries({ queryKey: [Queries.Recipes] });
            writeFavorite(id, !isFavorite);
            return { id, isFavorite };
        },

        onError: (_error, _variables, context) => {
            if (context) writeFavorite(context.id, context.isFavorite);
        },

        onSettled: () => {
            // «Обране» — це та сама вибірка з іншим `tab`, тож після зміни
            // прапорця її склад інший, а не лише вигляд картки.
            queryClient.invalidateQueries({ queryKey: [Queries.Recipes] });
        },
    });
