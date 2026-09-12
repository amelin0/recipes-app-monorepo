import { useMutation } from '@tanstack/react-query';

import { CatalogApi, type CreateRecipePayload } from '@/data';
import { queryClient, Queries } from '@/shared/services';

/** A dish the user composes from catalogue products. */
export const useCreateRecipe = () =>
    useMutation({
        mutationFn: (payload: CreateRecipePayload) => CatalogApi.createRecipe(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.Recipes] });
        },
    });

/** Only a dish the user made; the catalogue's own recipes answer 403. */
export const useDeleteRecipe = () =>
    useMutation({
        mutationFn: (id: string) => CatalogApi.deleteRecipe(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.Recipes] });
        },
    });
