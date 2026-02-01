import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  addItem: (product: Product, quantity: number, selectedOptions: Record<string, string>, variantId?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,

      addItem: (product, quantity, selectedOptions, variantId) => {
        const items = get().items;
        const optionsKey = JSON.stringify(selectedOptions);
        
        // Check if same product with same options exists
        const existingIndex = items.findIndex(
          item => item.product_id === product.id && 
          JSON.stringify(item.selected_options) === optionsKey
        );

        if (existingIndex >= 0) {
          // Update quantity
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            variant_id: variantId || null,
            quantity,
            selected_options: selectedOptions,
            product,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        const items = get().items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items });
      },

      applyCoupon: (code) => {
        set({ couponCode: code });
      },

      removeCoupon: () => {
        set({ couponCode: null });
      },

      clearCart: () => {
        set({ items: [], couponCode: null });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.product.sale_price || item.product.price;
          return sum + price * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'matjarna-cart',
    }
  )
);
