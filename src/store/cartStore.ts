import { create } from 'zustand'

export interface CartItem {
  product_id: number
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'subtotal'>) => void
  removeItem: (product_id: number) => void
  updateQty: (product_id: number, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  addItem: (item) => {
    const existing = get().items.find((i) => i.product_id === item.product_id)
    if (existing) {
      set({ items: get().items.map((i) =>
        i.product_id === item.product_id
          ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.price }
          : i
      )})
    } else {
      set({ items: [...get().items, { ...item, subtotal: item.price * item.quantity }] })
    }
  },
  removeItem: (product_id) => set({ items: get().items.filter((i) => i.product_id !== product_id) }),
  updateQty: (product_id, quantity) => set({
    items: get().items.map((i) =>
      i.product_id === product_id ? { ...i, quantity, subtotal: i.price * quantity } : i
    ),
  }),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((acc, i) => acc + i.subtotal, 0),
}))
