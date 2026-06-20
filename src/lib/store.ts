import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Category, Product, Floor, Table, Ingredient, RecipeItem, Order, OrderItem,
  DemoCustomer, Coupon, PaymentMethodConfig, KitchenStatus, PaymentMethod,
} from "./types";
import {
  seedCategories, seedProducts, seedFloors, seedTables, seedIngredients,
  seedRecipes, seedDemoCustomer, seedCoupons, seedPaymentMethods,
} from "./seed";

interface State {
  categories: Category[];
  products: Product[];
  floors: Floor[];
  tables: Table[];
  ingredients: Ingredient[];
  recipes: RecipeItem[];
  coupons: Coupon[];
  paymentMethods: PaymentMethodConfig[];
  customer: DemoCustomer;
  orders: Order[];
  orderCounter: number;

  // actions
  resetDemo: () => void;
  createOrder: (input: { tableId?: string | null; source: "POS" | "QR" | "Customer"; customerId?: string | null; customerName?: string | null; }) => Order;
  addItemToOrder: (orderId: string, productId: string, qty?: number) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  changeItemQty: (orderId: string, itemId: string, qty: number) => void;
  applyDiscount: (orderId: string, amount: number) => void;
  sendToKitchen: (orderId: string) => void;
  setKitchenStatus: (orderId: string, status: KitchenStatus) => void;
  markItemCompleted: (orderId: string, itemId: string) => void;
  payOrder: (orderId: string, method: PaymentMethod, cashReceived?: number) => void;
  getProductAvailability: (productId: string) => { available: boolean; possibleCount: number; lowIngredient?: string };
  getIngredientForProduct: (productId: string) => { ingredient: Ingredient; required: number }[];
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertCategory: (c: Category) => void;
  upsertTable: (t: Table) => void;
  upsertCoupon: (c: Coupon) => void;
  togglePaymentMethod: (id: PaymentMethod) => void;
  setUpiId: (upi: string) => void;
  addLoyaltyPoints: (n: number, spent: number) => void;
}

function newId() { return Math.random().toString(36).slice(2, 10); }

function calcTotals(items: OrderItem[], discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const tax_amount = Math.round(subtotal * 0.05);
  const total_amount = Math.max(0, subtotal + tax_amount - discount);
  return { subtotal, tax_amount, total_amount };
}

function calcPriority(items: OrderItem[], waitingMins: number) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const maxPrep = items.reduce((m, i) => Math.max(m, i.prep_time_minutes), 0);
  const score = waitingMins + totalItems + maxPrep;
  let level: "high" | "medium" | "normal" = "normal";
  if (score >= 30) level = "high";
  else if (score >= 18) level = "medium";
  return { score, level };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      products: seedProducts,
      floors: seedFloors,
      tables: seedTables,
      ingredients: seedIngredients,
      recipes: seedRecipes,
      coupons: seedCoupons,
      paymentMethods: seedPaymentMethods,
      customer: seedDemoCustomer,
      orders: [],
      orderCounter: 100,

      resetDemo: () => set({
        categories: seedCategories,
        products: seedProducts,
        floors: seedFloors,
        tables: seedTables.map(t => ({ ...t })),
        ingredients: seedIngredients,
        recipes: seedRecipes,
        coupons: seedCoupons,
        paymentMethods: seedPaymentMethods,
        customer: seedDemoCustomer,
        orders: [],
        orderCounter: 100,
      }),

      getIngredientForProduct: (productId) => {
        const recs = get().recipes.filter(r => r.product_id === productId);
        const ings = get().ingredients;
        return recs
          .map(r => {
            const ingredient = ings.find(i => i.id === r.ingredient_id);
            return ingredient ? { ingredient, required: r.quantity_required } : null;
          })
          .filter(Boolean) as { ingredient: Ingredient; required: number }[];
      },

      getProductAvailability: (productId) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return { available: false, possibleCount: 0 };
        if (!product.is_available || product.stock_qty <= 0) return { available: false, possibleCount: 0 };
        const ingMap = get().getIngredientForProduct(productId);
        if (ingMap.length === 0) return { available: true, possibleCount: product.stock_qty };
        let minPossible = product.stock_qty;
        let lowIngredient: string | undefined;
        for (const { ingredient, required } of ingMap) {
          const possible = Math.floor(ingredient.current_stock / required);
          if (possible < minPossible) { minPossible = possible; lowIngredient = ingredient.name; }
        }
        return { available: minPossible > 0, possibleCount: minPossible, lowIngredient: minPossible < 5 ? lowIngredient : undefined };
      },

      createOrder: ({ tableId, source, customerId, customerName }) => {
        const counter = get().orderCounter + 1;
        const now = new Date().toISOString();
        const order: Order = {
          id: newId(),
          order_number: `ORD-${counter}`,
          table_id: tableId || null,
          customer_id: customerId || null,
          customer_name: customerName || null,
          source,
          items: [],
          subtotal: 0,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 0,
          payment_status: "unpaid",
          order_status: "draft",
          kitchen_status: "to_cook",
          eta_minutes: 0,
          priority_score: 0,
          priority_level: "normal",
          delay_status: "on_time",
          created_at: now,
          updated_at: now,
        };
        set(s => ({
          orders: [order, ...s.orders],
          orderCounter: counter,
          tables: tableId ? s.tables.map(t => t.id === tableId ? { ...t, status: "ordering", current_order_id: order.id } : t) : s.tables,
        }));
        return order;
      },

      addItemToOrder: (orderId, productId, qty = 1) => {
        const p = get().products.find(x => x.id === productId);
        if (!p) return;
        set(s => ({
          orders: s.orders.map(o => {
            if (o.id !== orderId) return o;
            const existing = o.items.find(i => i.product_id === productId);
            let items;
            if (existing) {
              items = o.items.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + qty, line_total: (i.quantity + qty) * i.unit_price } : i);
            } else {
              const item: OrderItem = {
                id: newId(),
                product_id: p.id,
                product_name: p.name,
                quantity: qty,
                unit_price: p.price,
                line_total: p.price * qty,
                prep_time_minutes: p.prep_time_minutes,
                station: p.station,
                item_status: "to_cook",
              };
              items = [...o.items, item];
            }
            const totals = calcTotals(items, o.discount_amount);
            return { ...o, items, ...totals, updated_at: new Date().toISOString() };
          })
        }));
      },

      removeItemFromOrder: (orderId, itemId) => set(s => ({
        orders: s.orders.map(o => {
          if (o.id !== orderId) return o;
          const items = o.items.filter(i => i.id !== itemId);
          return { ...o, items, ...calcTotals(items, o.discount_amount), updated_at: new Date().toISOString() };
        })
      })),

      changeItemQty: (orderId, itemId, qty) => set(s => ({
        orders: s.orders.map(o => {
          if (o.id !== orderId) return o;
          if (qty <= 0) {
            const items = o.items.filter(i => i.id !== itemId);
            return { ...o, items, ...calcTotals(items, o.discount_amount) };
          }
          const items = o.items.map(i => i.id === itemId ? { ...i, quantity: qty, line_total: qty * i.unit_price } : i);
          return { ...o, items, ...calcTotals(items, o.discount_amount), updated_at: new Date().toISOString() };
        })
      })),

      applyDiscount: (orderId, amount) => set(s => ({
        orders: s.orders.map(o => o.id === orderId ? { ...o, discount_amount: amount, ...calcTotals(o.items, amount) } : o)
      })),

      sendToKitchen: (orderId) => set(s => {
        const queueLength = s.orders.filter(o => o.order_status === "sent_to_kitchen" && o.kitchen_status !== "completed").length;
        const queueBonus = queueLength >= 6 ? 10 : queueLength >= 3 ? 5 : 2;
        return {
          orders: s.orders.map(o => {
            if (o.id !== orderId) return o;
            const maxPrep = o.items.reduce((m, i) => Math.max(m, i.prep_time_minutes), 0);
            const eta = maxPrep + queueBonus;
            const { score, level } = calcPriority(o.items, 0);
            return { ...o, order_status: "sent_to_kitchen", kitchen_status: "to_cook", eta_minutes: eta, priority_score: score, priority_level: level, updated_at: new Date().toISOString() };
          }),
          tables: s.tables.map(t => t.current_order_id === orderId ? { ...t, status: "kitchen" } : t),
        };
      }),

      setKitchenStatus: (orderId, status) => set(s => {
        const order = s.orders.find(o => o.id === orderId);
        if (!order) return s;
        let newIngredients = s.ingredients;
        if (status === "completed" && order.kitchen_status !== "completed") {
          // deduct ingredients
          for (const item of order.items) {
            const recs = s.recipes.filter(r => r.product_id === item.product_id);
            for (const r of recs) {
              newIngredients = newIngredients.map(ing => ing.id === r.ingredient_id
                ? { ...ing, current_stock: Math.max(0, ing.current_stock - r.quantity_required * item.quantity), used_today: ing.used_today + r.quantity_required * item.quantity }
                : ing);
            }
          }
        }
        return {
          ingredients: newIngredients,
          orders: s.orders.map(o => o.id === orderId ? {
            ...o,
            kitchen_status: status,
            order_status: status === "completed" ? "ready" : o.order_status,
            items: o.items.map(i => ({ ...i, item_status: status })),
            updated_at: new Date().toISOString()
          } : o),
          tables: s.tables.map(t => t.current_order_id === orderId ? { ...t, status: status === "completed" ? "ready" : status === "preparing" ? "preparing" : t.status } : t),
        };
      }),

      markItemCompleted: (orderId, itemId) => set(s => ({
        orders: s.orders.map(o => o.id === orderId ? {
          ...o, items: o.items.map(i => i.id === itemId ? { ...i, item_status: "completed" } : i)
        } : o)
      })),

      payOrder: (orderId, method, cashReceived) => set(s => {
        const order = s.orders.find(o => o.id === orderId);
        if (!order) return s;
        const points = Math.floor(order.total_amount / 10);
        return {
          orders: s.orders.map(o => o.id === orderId ? { ...o, payment_status: "paid", order_status: "paid", payment_method: method, updated_at: new Date().toISOString() } : o),
          tables: s.tables.map(t => t.current_order_id === orderId ? { ...t, status: "paid", current_order_id: null } : t),
          products: s.products.map(p => {
            const item = order.items.find(i => i.product_id === p.id);
            if (!item) return p;
            return { ...p, stock_qty: Math.max(0, p.stock_qty - item.quantity), sold_today: p.sold_today + item.quantity };
          }),
          customer: order.customer_id === s.customer.id
            ? { ...s.customer, loyalty_points: s.customer.loyalty_points + points, total_spent: s.customer.total_spent + order.total_amount, total_orders: s.customer.total_orders + 1 }
            : s.customer,
        };
      }),

      addLoyaltyPoints: (n, spent) => set(s => ({
        customer: { ...s.customer, loyalty_points: s.customer.loyalty_points + n, total_spent: s.customer.total_spent + spent, total_orders: s.customer.total_orders + 1 }
      })),

      upsertProduct: (p) => set(s => {
        const exists = s.products.find(x => x.id === p.id);
        return { products: exists ? s.products.map(x => x.id === p.id ? p : x) : [...s.products, p] };
      }),
      deleteProduct: (id) => set(s => ({ products: s.products.filter(p => p.id !== id) })),
      upsertCategory: (c) => set(s => {
        const exists = s.categories.find(x => x.id === c.id);
        return { categories: exists ? s.categories.map(x => x.id === c.id ? c : x) : [...s.categories, c] };
      }),
      upsertTable: (t) => set(s => {
        const exists = s.tables.find(x => x.id === t.id);
        return { tables: exists ? s.tables.map(x => x.id === t.id ? t : x) : [...s.tables, t] };
      }),
      upsertCoupon: (c) => set(s => {
        const exists = s.coupons.find(x => x.id === c.id);
        return { coupons: exists ? s.coupons.map(x => x.id === c.id ? c : x) : [...s.coupons, c] };
      }),
      togglePaymentMethod: (id) => set(s => ({
        paymentMethods: s.paymentMethods.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
      })),
      setUpiId: (upi) => set(s => ({
        paymentMethods: s.paymentMethods.map(p => p.id === "upi" ? { ...p, upi_id: upi } : p)
      })),
    }),
    { name: "dineflow-store", version: 1 }
  )
);

// helpers
export function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function comboSuggestion(productIds: string[]): string | null {
  const set = new Set(productIds);
  if (set.has("p4") && !set.has("p7")) return "Add Fries to your Burger — popular combo, saves ₹20";
  if (set.has("p1") && !set.has("p10")) return "Pair your Coffee with a Brownie — your favorite combo";
  if (set.has("p5") && !set.has("p11")) return "Pizza goes great with Juice";
  if (set.has("p2") && !set.has("p8")) return "Tea + Samosa — the classic break";
  return null;
}
