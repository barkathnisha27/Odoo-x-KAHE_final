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
  currentCafeId: string | null;
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

  // Session State
  sessionOpen: boolean;
  sessionOpenedAt: string | null;
  sessionClosedAt: string | null;
  lastClosingAmount: number;
  currentSessionId: string | null;
  sessionEmployeeName: string | null;

  // actions
  openSession: (employeeName: string) => void;
  closeSession: () => void;
  setCurrentCafeId: (id: string | null) => void;
  initializeNewCafe: (cafeId: string) => void;
  resetDemo: () => void;
  createOrder: (input: { tableId?: string | null; source: "POS" | "QR" | "Customer"; customerId?: string | null; customerName?: string | null; }) => Order;
  addItemToOrder: (orderId: string, productId: string, qty?: number) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  changeItemQty: (orderId: string, itemId: string, qty: number) => void;
  applyDiscount: (orderId: string, amount: number) => void;
  sendToKitchen: (orderId: string) => void;
  sendOrderToKitchen: (order: Partial<Order>) => Order;
  setKitchenStatus: (orderId: string, status: KitchenStatus) => void;
  markItemCompleted: (orderId: string, itemId: string) => void;
  payOrder: (orderId: string, method: PaymentMethod, cashReceived?: number) => void;
  setOrderCustomer: (orderId: string, name: string, email: string, phone: string) => void;
  getProductAvailability: (productId: string) => { available: boolean; possibleCount: number; lowIngredient?: string };
  getIngredientForProduct: (productId: string) => { ingredient: Ingredient; required: number }[];
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertCategory: (c: Category) => void;
  upsertFloor: (f: Floor) => void;
  deleteFloor: (id: string) => void;
  upsertTable: (t: Table) => void;
  deleteTable: (id: string) => void;
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

function normalizeOrderItem(item: OrderItem) {
  return {
    ...item,
    item_status: item.item_status || "to_cook",
    status: item.status || item.item_status || "to_cook",
    kitchen_status: item.kitchen_status || item.item_status || "to_cook",
    completed: item.completed ?? false,
  };
}

function normalizeOrderItems(items: OrderItem[] = []) {
  return items.map(normalizeOrderItem);
}

// Deduplication helper — keeps the first occurrence by key
function dedupeArr<T>(arr: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return (arr || []).filter(item => {
    const key = getKey(item).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- EMERGENCY LOCALSTORAGE BRIDGE ---
export const KITCHEN_ORDERS_KEY = "dineflow_kitchen_orders";
export const ACTIVE_CUSTOMER_ORDER_KEY = "dineflow_active_customer_order";

export function getKitchenOrders() {
  try {
    return JSON.parse(localStorage.getItem(KITCHEN_ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveKitchenOrder(order: any) {
  const existing = getKitchenOrders();
  const finalOrder = normalizeOrderForKitchen(order);
  const updated = [
    finalOrder,
    ...existing.filter((o: any) => (o.id || o.order_number) !== (finalOrder.id || finalOrder.order_number)),
  ];
  localStorage.setItem(KITCHEN_ORDERS_KEY, JSON.stringify(updated));
  localStorage.setItem(ACTIVE_CUSTOMER_ORDER_KEY, JSON.stringify(finalOrder));
  window.dispatchEvent(new Event("dineflow-orders-updated"));
  return finalOrder;
}

export function updateKitchenOrderStatus(orderId: string, status: string) {
  const existing = getKitchenOrders();
  const customerStatus =
    status === "to_cook" ? "sent_to_kitchen" :
    status === "preparing" ? "preparing" :
    status === "completed" ? "ready_to_serve" :
    status;

  const updated = existing.map((order: any) => {
    if ((order.id || order.order_number) !== orderId) return order;

    return {
      ...order,
      status,
      order_status: status,
      kitchen_status: status,
      customer_status: customerStatus,
      updated_at: new Date().toISOString(),
      items: Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            ...item,
            status,
            kitchen_status: status,
            completed: status === "completed" ? true : item.completed || false,
          }))
        : [],
    };
  });

  localStorage.setItem(KITCHEN_ORDERS_KEY, JSON.stringify(updated));

  const activeRaw = localStorage.getItem(ACTIVE_CUSTOMER_ORDER_KEY);
  if (activeRaw) {
    try {
      const active = JSON.parse(activeRaw);
      const activeId = active.id || active.order_number;
      if (activeId === orderId) {
        const updatedActive = updated.find((o: any) => (o.id || o.order_number) === orderId);
        if (updatedActive) {
          localStorage.setItem(ACTIVE_CUSTOMER_ORDER_KEY, JSON.stringify(updatedActive));
        }
      }
    } catch {}
  }

  window.dispatchEvent(new Event("dineflow-orders-updated"));
  return updated;
}

export function normalizeOrderForKitchen(order: any) {
  const id = order.id || `ORD-${Date.now()}`;
  const now = new Date().toISOString();

  const items = Array.isArray(order.items) ? order.items : [];
  const normalizedItems = items.map((item: any, index: number) => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.unit_price || item.price || 0);
    const name = item.product_name || item.name || item.title || `Item ${index + 1}`;

    return {
      ...item,
      id: item.id || item.product_id || `ITEM-${Date.now()}-${index}`,
      product_id: item.product_id || item.id || `P-${index}`,
      product_name: name,
      name,
      quantity: qty,
      unit_price: price,
      price,
      subtotal: Number(item.subtotal || qty * price),
      status: "to_cook",
      kitchen_status: "to_cook",
      completed: false,
    };
  });

  const subtotal = Number(
    order.subtotal ||
    normalizedItems.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0)
  );
  const discount = Number(order.discount_amount || order.discount || 0);
  const tax = Number(order.tax_amount || order.tax || 0);
  const total = Number(order.total_amount || order.total || subtotal - discount + tax);

  return {
    ...order,
    id,
    order_number: order.order_number || id,
    cafe_id: order.cafe_id || "demo-cafe",
    customer_id: order.customer_id || null,
    customer_name: order.customer_name || order.customerName || "Customer",
    customer_email: order.customer_email || order.customerEmail || null,
    table_id: order.table_id || null,
    table_number: order.table_number || order.tableNumber || "N/A",
    order_source: order.order_source || "customer",
    items: normalizedItems,
    subtotal,
    discount_amount: discount,
    tax_amount: tax,
    total_amount: total,
    status: "to_cook",
    order_status: "to_cook",
    kitchen_status: "to_cook",
    customer_status: "sent_to_kitchen",
    payment_status: order.payment_status || "pending",
    created_at: order.created_at || now,
    updated_at: now,
  };
}
// ------------------------------------

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentCafeId: "demo-cafe-1",
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

      sessionOpen: false,
      sessionOpenedAt: null,
      sessionClosedAt: null,
      lastClosingAmount: 0,
      currentSessionId: null,
      sessionEmployeeName: null,

      openSession: (employeeName) => set({
        sessionOpen: true,
        sessionOpenedAt: new Date().toISOString(),
        sessionEmployeeName: employeeName,
        currentSessionId: Math.random().toString(36).slice(2, 10),
      }),

      closeSession: () => set(s => {
        // Calculate closing amount from paid/completed orders in current session
        // (For simplicity, we'll sum all paid orders for now or since sessionOpenedAt)
        let lastClosingAmount = 0;
        if (s.sessionOpenedAt) {
          const openedTime = new Date(s.sessionOpenedAt).getTime();
          lastClosingAmount = s.orders
            .filter(o => o.payment_status === "paid" && new Date(o.updated_at).getTime() >= openedTime)
            .reduce((sum, o) => sum + o.total_amount, 0);
        }
        return {
          sessionOpen: false,
          sessionClosedAt: new Date().toISOString(),
          lastClosingAmount,
        };
      }),

      setCurrentCafeId: (id) => set({ currentCafeId: id }),

      initializeNewCafe: (cafeId) => set(s => {
        // Only seed if this cafe has NO data yet
        const alreadyHasData =
          s.categories.some(c => c.cafe_id === cafeId) ||
          s.products.some(p => p.cafe_id === cafeId) ||
          s.floors.some(f => f.cafe_id === cafeId);

        if (alreadyHasData) {
          // Cafe already initialized – just dedupe in case of any drift
          return {
            categories: dedupeArr(s.categories, c => `${c.cafe_id || "demo"}|${c.name}`),
            products: dedupeArr(s.products, p => `${p.cafe_id || "demo"}|${p.name}`),
            floors: dedupeArr(s.floors, f => `${f.cafe_id || "demo"}|${f.name}`),
            tables: dedupeArr(s.tables, t => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`),
            ingredients: dedupeArr(s.ingredients, i => `${i.cafe_id || "demo"}|${i.name}`),
            recipes: dedupeArr(s.recipes, r => `${r.cafe_id || "demo"}|${r.product_id}|${r.ingredient_id}`),
            coupons: dedupeArr(s.coupons, c => `${c.cafe_id || "demo"}|${c.code}`),
            paymentMethods: dedupeArr(s.paymentMethods, p => `${p.cafe_id || "demo"}|${p.id}`),
          };
        }

        // Fresh cafe — seed with new cafe_id
        const newCats = seedCategories.map(c => ({ ...c, id: `${c.id}-${cafeId}`, cafe_id: cafeId }));
        const newProds = seedProducts.map(p => ({ ...p, id: `${p.id}-${cafeId}`, cafe_id: cafeId }));
        const newFloors = seedFloors.map(f => ({ ...f, id: `${f.id}-${cafeId}`, cafe_id: cafeId }));
        const newTables = seedTables.map(t => ({ ...t, id: `${t.id}-${cafeId}`, cafe_id: cafeId, floor_id: `${t.floor_id}-${cafeId}`, qr_token: `tbl-${t.id}-${Math.random().toString(36).slice(2, 8)}` }));
        const newIngs = seedIngredients.map(i => ({ ...i, id: `${i.id}-${cafeId}`, cafe_id: cafeId }));
        const newRecipes = seedRecipes.map(r => ({ ...r, cafe_id: cafeId, product_id: `${r.product_id}-${cafeId}`, ingredient_id: `${r.ingredient_id}-${cafeId}` }));
        const newCoupons = seedCoupons.map(c => ({ ...c, id: `${c.id}-${cafeId}`, cafe_id: cafeId }));
        const newPMs = seedPaymentMethods.map(p => ({ ...p, cafe_id: cafeId }));

        return {
          categories: dedupeArr([...s.categories, ...newCats], c => `${c.cafe_id || "demo"}|${c.name}`),
          products: dedupeArr([...s.products, ...newProds], p => `${p.cafe_id || "demo"}|${p.name}`),
          floors: dedupeArr([...s.floors, ...newFloors], f => `${f.cafe_id || "demo"}|${f.name}`),
          tables: dedupeArr([...s.tables, ...newTables], t => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`),
          ingredients: dedupeArr([...s.ingredients, ...newIngs], i => `${i.cafe_id || "demo"}|${i.name}`),
          recipes: dedupeArr([...s.recipes, ...newRecipes], r => `${r.cafe_id || "demo"}|${r.product_id}|${r.ingredient_id}`),
          coupons: dedupeArr([...s.coupons, ...newCoupons], c => `${c.cafe_id || "demo"}|${c.code}`),
          paymentMethods: dedupeArr([...s.paymentMethods, ...newPMs], p => `${p.cafe_id || "demo"}|${p.id}`),
        };
      }),

      resetDemo: () => set({
        currentCafeId: "demo-cafe-1",
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
        const cafeId = get().currentCafeId || "demo-cafe-1";
        const recs = get().recipes.filter(r => r.product_id === productId && r.cafe_id === cafeId);
        const ings = get().ingredients.filter(i => i.cafe_id === cafeId);
        return recs
          .map(r => {
            const ingredient = ings.find(i => i.id === r.ingredient_id);
            return ingredient ? { ingredient, required: r.quantity_required } : null;
          })
          .filter(Boolean) as { ingredient: Ingredient; required: number }[];
      },

      getProductAvailability: (productId) => {
        const cafeId = get().currentCafeId || "demo-cafe-1";
        const product = get().products.find(p => p.id === productId && p.cafe_id === cafeId);
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
        const cafeId = get().currentCafeId || "demo-cafe-1";
        const counter = get().orderCounter + 1;
        const now = new Date().toISOString();
        const order: Order = {
          id: newId(),
          cafe_id: cafeId,
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
          tables: tableId ? s.tables.map(t => t.id === tableId && t.cafe_id === cafeId ? { ...t, status: "ordering", current_order_id: order.id } : t) : s.tables,
        }));
        return order;
      },

      addItemToOrder: (orderId, productId, qty = 1) => {
        const cafeId = get().currentCafeId || "demo-cafe-1";
        const p = get().products.find(x => x.id === productId && x.cafe_id === cafeId);
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
                status: "to_cook",
                kitchen_status: "to_cook",
                completed: false,
              };
              items = [...o.items, item];
            }
            const itemsWithStatus = normalizeOrderItems(items);
            const totals = calcTotals(itemsWithStatus, o.discount_amount);
            return { ...o, items: itemsWithStatus, ...totals, updated_at: new Date().toISOString() };
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
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const queueLength = s.orders.filter(o => o.order_status === "sent_to_kitchen" && o.kitchen_status !== "completed" && o.cafe_id === cafeId).length;
        const queueBonus = queueLength >= 6 ? 10 : queueLength >= 3 ? 5 : 2;
        return {
          orders: s.orders.map(o => {
            if (o.id !== orderId) return o;
            const maxPrep = o.items.reduce((m, i) => Math.max(m, i.prep_time_minutes), 0);
            const eta = maxPrep + queueBonus;
            const { score, level } = calcPriority(o.items, 0);
            return { 
              ...o,
              status: "to_cook",
              order_status: "to_cook", 
              kitchen_status: "to_cook", 
              payment_status: o.payment_status === "paid" ? "paid" : "unpaid",
              items: normalizeOrderItems(o.items),
              eta_minutes: eta, 
              priority_score: score, 
              priority_level: level, 
              updated_at: new Date().toISOString() 
            };
          }),
          tables: s.tables.map(t => t.current_order_id === orderId && t.cafe_id === cafeId ? { ...t, status: "ordering" } : t),
        };
      }),
      sendOrderToKitchen: (order) => {
        const id = order.id || `ORD-${Date.now()}`;
        const cafeId = get().currentCafeId || "demo-cafe-1";
        
        const finalOrder: Order = {
          ...order,
          id,
          cafe_id: order.cafe_id || cafeId,
          order_number: order.order_number || id,
          status: "to_cook",
          order_status: "to_cook",
          kitchen_status: "to_cook",
          customer_status: "sent_to_kitchen",
          payment_status: order.payment_status || "pending",
          created_at: order.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: Array.isArray(order.items)
            ? order.items.map((item: any) => {
                const qty = Number(item.quantity || 1);
                const price = Number(item.unit_price || item.price || 0);
                const itemName =
                  item.product_name ||
                  item.name ||
                  item.title ||
                  "Unnamed Item";

                return {
                  ...item,
                  id: item.id || item.product_id || `ITEM-${Date.now()}-${Math.random()}`,
                  product_id: item.product_id || item.id,
                  product_name: itemName,
                  name: itemName,
                  quantity: qty,
                  unit_price: price,
                  price,
                  subtotal: Number(item.subtotal || qty * price),
                  line_total: Number(item.line_total || item.subtotal || qty * price),
                  status: "to_cook",
                  item_status: "to_cook",
                  order_status: "to_cook",
                  kitchen_status: "to_cook",
                  completed: false,
                };
              })
            : [],
        } as Order;

        set((state: any) => {
          const existingOrders = Array.isArray(state.orders) ? state.orders : [];
          const existingKitchenOrders = Array.isArray(state.kitchenOrders) ? state.kitchenOrders : [];

          const nextState: any = {
            orders: [
              finalOrder,
              ...existingOrders.filter((o: any) => o.id !== finalOrder.id),
            ],
            activeCustomerOrder: finalOrder,
          };

          if ("kitchenOrders" in state || existingKitchenOrders.length > 0) {
            nextState.kitchenOrders = [
              finalOrder,
              ...existingKitchenOrders.filter((o: any) => o.id !== finalOrder.id),
            ];
          }

          if (finalOrder.table_id) {
            nextState.tables = state.tables.map((t: any) => 
              t.id === finalOrder.table_id && t.cafe_id === cafeId 
                ? { ...t, status: "ordering", current_order_id: finalOrder.id } 
                : t
            );
          }

          return nextState;
        });

        return finalOrder;
      },

      setKitchenStatus: (orderId, status) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        // Find by id only — do not filter by cafe_id here to avoid silent failures
        const order = s.orders.find(o => o.id === orderId);
        if (!order) return s;
        let newIngredients = s.ingredients;
        if (status === "completed" && order.kitchen_status !== "completed") {
          for (const item of order.items) {
            const recs = s.recipes.filter(r => r.product_id === item.product_id && r.cafe_id === cafeId);
            for (const r of recs) {
              newIngredients = newIngredients.map(ing => ing.id === r.ingredient_id && ing.cafe_id === cafeId
                ? { ...ing, current_stock: Math.max(0, ing.current_stock - r.quantity_required * item.quantity), used_today: ing.used_today + r.quantity_required * item.quantity }
                : ing);
            }
          }
        }
        return {
          ingredients: newIngredients,
          orders: s.orders.map(o => o.id === orderId ? {
            ...o,
            status,
            kitchen_status: status,
            order_status: status,
            customer_status: status,
            items: o.items.map(i => ({ ...i, item_status: status, status, kitchen_status: status })),
            updated_at: new Date().toISOString()
          } : o),
          tables: s.tables.map(t => t.current_order_id === orderId && t.cafe_id === cafeId ? { ...t, status: status === "completed" ? "ready" : status === "preparing" ? "preparing" : t.status } : t),
        };
      }),

      markItemCompleted: (orderId, itemId) => set(s => ({
        orders: s.orders.map(o => o.id === orderId ? {
          ...o,
          items: o.items.map(i => i.id === itemId ? { ...i, item_status: "completed", status: "completed", kitchen_status: "completed", completed: true } : i)
        } : o)
      })),

      payOrder: (orderId, method, cashReceived) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const order = s.orders.find(o => o.id === orderId && o.cafe_id === cafeId);
        if (!order) return s;
        const points = Math.floor(order.total_amount / 10);
        return {
          orders: s.orders.map(o => o.id === orderId ? { ...o, payment_status: "paid", order_status: "paid", payment_method: method, updated_at: new Date().toISOString() } : o),
          tables: s.tables.map(t => t.current_order_id === orderId && t.cafe_id === cafeId ? { ...t, status: "paid", current_order_id: null } : t),
          products: s.products.map(p => {
            const item = order.items.find(i => i.product_id === p.id);
            if (!item || p.cafe_id !== cafeId) return p;
            return { ...p, stock_qty: Math.max(0, p.stock_qty - item.quantity), sold_today: p.sold_today + item.quantity };
          }),
          customer: order.customer_id === s.customer.id
            ? { ...s.customer, loyalty_points: s.customer.loyalty_points + points, total_spent: s.customer.total_spent + order.total_amount, total_orders: s.customer.total_orders + 1 }
            : s.customer,
        };
      }),

      setOrderCustomer: (orderId, name, email, phone) => set(s => ({
        orders: s.orders.map(o => o.id === orderId ? { ...o, customer_name: name, customer_email: email, customer_phone: phone } : o)
      })),

      addLoyaltyPoints: (n, spent) => set(s => ({
        customer: { ...s.customer, loyalty_points: s.customer.loyalty_points + n, total_spent: s.customer.total_spent + spent, total_orders: s.customer.total_orders + 1 }
      })),

      upsertProduct: (p) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const productWithCafe = { ...p, cafe_id: cafeId };
        const exists = s.products.find(x => x.id === p.id && x.cafe_id === cafeId);
        return { products: exists ? s.products.map(x => x.id === p.id && x.cafe_id === cafeId ? productWithCafe : x) : [...s.products, productWithCafe] };
      }),
      deleteProduct: (id) => set(s => ({ products: s.products.filter(p => p.id !== id) })),
      upsertCategory: (c) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const categoryWithCafe = { ...c, cafe_id: cafeId };
        const exists = s.categories.find(x => x.id === c.id && x.cafe_id === cafeId);
        return { categories: exists ? s.categories.map(x => x.id === c.id && x.cafe_id === cafeId ? categoryWithCafe : x) : [...s.categories, categoryWithCafe] };
      }),
      upsertFloor: (f) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const floorWithCafe = { ...f, cafe_id: cafeId };
        const exists = s.floors.find(x => x.id === f.id && x.cafe_id === cafeId);
        return { floors: exists ? s.floors.map(x => x.id === f.id && x.cafe_id === cafeId ? floorWithCafe : x) : [...s.floors, floorWithCafe] };
      }),
      deleteFloor: (id) => set(s => ({ floors: s.floors.filter(f => f.id !== id) })),
      upsertTable: (t) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const tableWithCafe = { ...t, cafe_id: cafeId };
        const exists = s.tables.find(x => x.id === t.id && x.cafe_id === cafeId);
        return { tables: exists ? s.tables.map(x => x.id === t.id && x.cafe_id === cafeId ? tableWithCafe : x) : [...s.tables, tableWithCafe] };
      }),
      deleteTable: (id) => set(s => ({ tables: s.tables.filter(t => t.id !== id) })),
      upsertCoupon: (c) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        const couponWithCafe = { ...c, cafe_id: cafeId };
        const exists = s.coupons.find(x => x.id === c.id && x.cafe_id === cafeId);
        return { coupons: exists ? s.coupons.map(x => x.id === c.id && x.cafe_id === cafeId ? couponWithCafe : x) : [...s.coupons, couponWithCafe] };
      }),
      togglePaymentMethod: (id) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        return {
          paymentMethods: s.paymentMethods.map(p => p.id === id && p.cafe_id === cafeId ? { ...p, enabled: !p.enabled } : p)
        };
      }),
      setUpiId: (upi) => set(s => {
        const cafeId = s.currentCafeId || "demo-cafe-1";
        return {
          paymentMethods: s.paymentMethods.map(p => p.id === "upi" && p.cafe_id === cafeId ? { ...p, upi_id: upi } : p)
        };
      }),
    }),
    {
      name: "dineflow-store-v4",   // bumped version to force fresh state
      version: 4,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Always dedupe on rehydration to fix any accumulated duplicates
        state.categories = dedupeArr(state.categories || [], c => `${c.cafe_id || "demo"}|${c.name}`);
        state.products = dedupeArr(state.products || [], p => `${p.cafe_id || "demo"}|${p.name}`);
        state.floors = dedupeArr(state.floors || [], f => `${f.cafe_id || "demo"}|${f.name}`);
        state.tables = dedupeArr(state.tables || [], t => `${t.cafe_id || "demo"}|${t.floor_id}|${t.table_number}`);
        state.ingredients = dedupeArr(state.ingredients || [], i => `${i.cafe_id || "demo"}|${i.name}`);
        state.recipes = dedupeArr(state.recipes || [], r => `${r.cafe_id || "demo"}|${r.product_id}|${r.ingredient_id}`);
        state.paymentMethods = dedupeArr(state.paymentMethods || [], p => `${p.cafe_id || "demo"}|${p.id}`);
        state.coupons = dedupeArr(state.coupons || [], c => `${c.cafe_id || "demo"}|${c.code}`);
      }
    }
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
