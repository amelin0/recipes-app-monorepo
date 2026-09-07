export * from './auth'
export * from './user'
export * from './dashboard'
export * from './support'
export * from './notifications'
export * from './recipe'
export * from './language'
export * from './tag'

// `product` is re-exported by name: it still carries the V1 `Product` shape,
// while `recipe` exports the one the search endpoint really returns. Two types
// of the same name in one barrel is exactly the ambiguity that would send a
// screen to the wrong one.
export { ProductApi } from './product'
export type {
  ProductDetail,
  ProductFilters,
  PaginatedProducts,
  UpdateProductParams,
} from './product'
