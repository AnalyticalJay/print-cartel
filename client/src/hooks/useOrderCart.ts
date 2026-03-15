import { create } from "zustand";

export interface CartLineItem {
  id: string; // Temporary ID for UI
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  placementId: number;
  printSizeId: number;
  unitPrice: number;
  productName?: string;
  colorName?: string;
  sizeName?: string;
  placementName?: string;
  printSizeName?: string;
}

interface OrderCartStore {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartLineItem>) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useOrderCart = create<OrderCartStore>((set: any, get: any) => ({
  items: [] as CartLineItem[],

  addItem: (item: CartLineItem) =>
    set((state: OrderCartStore) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: item.id || `${Date.now()}-${Math.random()}`,
        },
      ],
    })),

  removeItem: (id: string) =>
    set((state: OrderCartStore) => ({
      items: state.items.filter((item: CartLineItem) => item.id !== id),
    })),

  updateItem: (id: string, updates: Partial<CartLineItem>) =>
    set((state: OrderCartStore) => ({
      items: state.items.map((item: CartLineItem) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  clearCart: () => set((): Partial<OrderCartStore> => ({ items: [] })),

  getTotal: (): number => {
    const state = get() as OrderCartStore;
    return state.items.reduce((total: number, item: CartLineItem) => total + item.unitPrice * item.quantity, 0);
  },

  getItemCount: (): number => {
    const state = get() as OrderCartStore;
    return state.items.reduce((count: number, item: CartLineItem) => count + item.quantity, 0);
  },
}));
