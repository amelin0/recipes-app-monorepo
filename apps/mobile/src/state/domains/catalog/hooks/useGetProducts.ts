import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { CatalogApi, type CreateProductPayload, type ProductListQuery } from '@/data';
import { productKeys, queryClient, Queries } from '@/shared/services';
import { useStore } from '@/state';

const PAGE_SIZE = 20;

/** The product catalogue, paged and searchable. */
export const useGetProducts = (filters: Omit<ProductListQuery, 'page' | 'limit'> = {}) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useInfiniteQuery({
        queryKey: productKeys.products(filters),
        queryFn: ({ pageParam }) => CatalogApi.getProducts({ ...filters, page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: last => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
        enabled: isAuthenticated,
    });
};

/** A product the user types in by hand; it joins their own catalogue. */
export const useCreateProduct = () =>
    useMutation({
        mutationFn: (payload: CreateProductPayload) => CatalogApi.createProduct(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Queries.Products] });
        },
    });
