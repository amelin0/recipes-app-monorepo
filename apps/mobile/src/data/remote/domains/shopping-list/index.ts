export { ShoppingListApi } from './shopping-list.api';
// Перелічено поіменно, а не `export type *`: зірочка винесла б і `Reference`,
// імпортований із каталогу, і той самий тип зʼявився б у спільному бареді
// двічі.
export type {
    AddShoppingItemPayload,
    ShoppingGroup,
    ShoppingItem,
    ShoppingItemOrigin,
    ShoppingList,
    ShoppingUnit,
} from './shopping-list.types';
