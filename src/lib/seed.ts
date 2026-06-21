import type { Category, Product, Floor, Table, Ingredient, RecipeItem, DemoCustomer, Coupon, PaymentMethodConfig } from "./types";

const cafe_id = "demo-cafe-1";

export const seedCategories: Category[] = [
  { id: "c1", cafe_id, name: "Beverages", color: "#c2956b", icon: "Coffee" },
  { id: "c2", cafe_id, name: "Snacks", color: "#e8a87c", icon: "Cookie" },
  { id: "c3", cafe_id, name: "Main Course", color: "#c4654a", icon: "Utensils" },
  { id: "c4", cafe_id, name: "Desserts", color: "#9b72cf", icon: "IceCream" },
];

export const seedProducts: Product[] = [
  { id: "p1", cafe_id, name: "Coffee", category_id: "c1", price: 80, unit: "cup", tax_percentage: 5, prep_time_minutes: 4, station: "Beverage Counter", stock_qty: 50, sold_today: 18, margin_percentage: 55, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg"] },
  { id: "p2", cafe_id, name: "Tea", category_id: "c1", price: 40, unit: "cup", tax_percentage: 5, prep_time_minutes: 3, station: "Beverage Counter", stock_qty: 60, sold_today: 22, margin_percentage: 60, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg"] },
  { id: "p3", cafe_id, name: "Cold Coffee", category_id: "c1", price: 120, unit: "cup", tax_percentage: 5, prep_time_minutes: 5, station: "Beverage Counter", stock_qty: 35, sold_today: 9, margin_percentage: 50, is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg"] },
  { id: "p4", cafe_id, name: "Burger", category_id: "c3", price: 150, unit: "piece", tax_percentage: 5, prep_time_minutes: 12, station: "Hot Kitchen", stock_qty: 25, sold_today: 8, margin_percentage: 45, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg"] },
  { id: "p5", cafe_id, name: "Pizza", category_id: "c3", price: 220, unit: "piece", tax_percentage: 5, prep_time_minutes: 15, station: "Hot Kitchen", stock_qty: 20, sold_today: 5, margin_percentage: 50, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg"] },
  { id: "p6", cafe_id, name: "Sandwich", category_id: "c2", price: 110, unit: "piece", tax_percentage: 5, prep_time_minutes: 7, station: "Snacks Counter", stock_qty: 45, sold_today: 12, margin_percentage: 50, is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg", "quick"] },
  { id: "p7", cafe_id, name: "Fries", category_id: "c2", price: 90, unit: "plate", tax_percentage: 5, prep_time_minutes: 8, station: "Snacks Counter", stock_qty: 30, sold_today: 14, margin_percentage: 60, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg"] },
  { id: "p8", cafe_id, name: "Samosa", category_id: "c2", price: 40, unit: "piece", tax_percentage: 5, prep_time_minutes: 5, station: "Snacks Counter", stock_qty: 50, sold_today: 20, margin_percentage: 65, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg", "spicy", "budget"] },
  { id: "p9", cafe_id, name: "Chocolate Cake", category_id: "c4", price: 130, unit: "slice", tax_percentage: 5, prep_time_minutes: 4, station: "Dessert Counter", stock_qty: 18, sold_today: 6, margin_percentage: 55, is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg", "sweet"] },
  { id: "p10", cafe_id, name: "Brownie", category_id: "c4", price: 100, unit: "piece", tax_percentage: 5, prep_time_minutes: 4, station: "Dessert Counter", stock_qty: 20, sold_today: 11, margin_percentage: 60, is_kitchen_item: true, is_available: true, is_popular: true, dietary_tags: ["veg", "sweet"] },
  { id: "p11", cafe_id, name: "Juice", category_id: "c1", price: 90, unit: "glass", tax_percentage: 5, prep_time_minutes: 5, station: "Beverage Counter", stock_qty: 35, sold_today: 7, margin_percentage: 55, is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg", "healthy"] },
  { id: "p12", cafe_id, name: "Pasta", category_id: "c3", price: 180, unit: "plate", tax_percentage: 5, prep_time_minutes: 14, station: "Hot Kitchen", stock_qty: 20, sold_today: 4, margin_percentage: 50, is_kitchen_item: true, is_available: true, is_popular: false, dietary_tags: ["veg"] },
];

export const seedFloors: Floor[] = [
  { id: "f1", cafe_id, name: "Floor 1" },
  { id: "f2", cafe_id, name: "Floor 2" },
];

export const seedTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  cafe_id,
  floor_id: i < 6 ? "f1" : "f2",
  table_number: i + 1,
  seats: i % 2 === 0 ? 4 : 2,
  active: true,
  status: "available" as const,
  qr_token: `tbl-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
  current_order_id: null,
}));

export const seedIngredients: Ingredient[] = [
  { id: "i1", cafe_id, name: "Coffee Powder", unit: "g", current_stock: 2000, min_stock_level: 300, cost_per_unit: 1.2, supplier_name: "Beans & Co", category: "Dry", used_today: 220 },
  { id: "i2", cafe_id, name: "Milk", unit: "ml", current_stock: 10000, min_stock_level: 1500, cost_per_unit: 0.05, supplier_name: "Aavin Dairy", category: "Dairy", used_today: 3200 },
  { id: "i3", cafe_id, name: "Sugar", unit: "g", current_stock: 3000, min_stock_level: 500, cost_per_unit: 0.04, supplier_name: "SugarMart", category: "Dry", used_today: 280 },
  { id: "i4", cafe_id, name: "Burger Bun", unit: "pcs", current_stock: 50, min_stock_level: 10, cost_per_unit: 8, supplier_name: "Bakery Hub", category: "Bakery", used_today: 8 },
  { id: "i5", cafe_id, name: "Veg Patty", unit: "pcs", current_stock: 40, min_stock_level: 8, cost_per_unit: 22, supplier_name: "FreshVeg", category: "Frozen", used_today: 8 },
  { id: "i6", cafe_id, name: "Cheese Slice", unit: "pcs", current_stock: 60, min_stock_level: 10, cost_per_unit: 6, supplier_name: "Dairy Hub", category: "Dairy", used_today: 18 },
  { id: "i7", cafe_id, name: "Lettuce", unit: "g", current_stock: 2000, min_stock_level: 300, cost_per_unit: 0.08, supplier_name: "FreshVeg", category: "Produce", used_today: 160 },
  { id: "i8", cafe_id, name: "Sauce", unit: "ml", current_stock: 3000, min_stock_level: 500, cost_per_unit: 0.05, supplier_name: "SauceMart", category: "Condiment", used_today: 280 },
  { id: "i9", cafe_id, name: "Potato", unit: "g", current_stock: 5000, min_stock_level: 800, cost_per_unit: 0.04, supplier_name: "FreshVeg", category: "Produce", used_today: 2100 },
  { id: "i10", cafe_id, name: "Pizza Base", unit: "pcs", current_stock: 25, min_stock_level: 5, cost_per_unit: 25, supplier_name: "Bakery Hub", category: "Bakery", used_today: 5 },
  { id: "i11", cafe_id, name: "Pasta", unit: "g", current_stock: 4000, min_stock_level: 700, cost_per_unit: 0.12, supplier_name: "ItaliMart", category: "Dry", used_today: 480 },
  { id: "i12", cafe_id, name: "Chocolate Syrup", unit: "ml", current_stock: 2000, min_stock_level: 300, cost_per_unit: 0.18, supplier_name: "SauceMart", category: "Condiment", used_today: 120 },
];

export const seedRecipes: RecipeItem[] = [
  { cafe_id, product_id: "p1", ingredient_id: "i1", quantity_required: 10 },
  { cafe_id, product_id: "p1", ingredient_id: "i2", quantity_required: 150 },
  { cafe_id, product_id: "p1", ingredient_id: "i3", quantity_required: 10 },
  { cafe_id, product_id: "p4", ingredient_id: "i4", quantity_required: 1 },
  { cafe_id, product_id: "p4", ingredient_id: "i5", quantity_required: 1 },
  { cafe_id, product_id: "p4", ingredient_id: "i6", quantity_required: 1 },
  { cafe_id, product_id: "p4", ingredient_id: "i7", quantity_required: 20 },
  { cafe_id, product_id: "p4", ingredient_id: "i8", quantity_required: 10 },
  { cafe_id, product_id: "p7", ingredient_id: "i9", quantity_required: 150 },
  { cafe_id, product_id: "p7", ingredient_id: "i8", quantity_required: 20 },
  { cafe_id, product_id: "p5", ingredient_id: "i10", quantity_required: 1 },
  { cafe_id, product_id: "p5", ingredient_id: "i6", quantity_required: 2 },
  { cafe_id, product_id: "p5", ingredient_id: "i8", quantity_required: 30 },
  { cafe_id, product_id: "p12", ingredient_id: "i11", quantity_required: 120 },
  { cafe_id, product_id: "p12", ingredient_id: "i8", quantity_required: 40 },
  { cafe_id, product_id: "p12", ingredient_id: "i6", quantity_required: 1 },
  { cafe_id, product_id: "p3", ingredient_id: "i1", quantity_required: 12 },
  { cafe_id, product_id: "p3", ingredient_id: "i2", quantity_required: 200 },
  { cafe_id, product_id: "p3", ingredient_id: "i3", quantity_required: 15 },
  { cafe_id, product_id: "p3", ingredient_id: "i12", quantity_required: 20 },
];

export const seedCoupons: Coupon[] = [
  { id: "co1", cafe_id, code: "COFFEE10", discount_type: "percentage", discount_value: 10, active: true },
  { id: "co2", cafe_id, code: "WELCOME50", discount_type: "fixed", discount_value: 50, active: true },
  { id: "co3", cafe_id, code: "STUDENT", discount_type: "percentage", discount_value: 15, active: true },
];

export const seedDemoCustomer: DemoCustomer = {
  id: "demo-customer",
  cafe_id,
  name: "Aisha",
  email: "customer@dineflow.ai",
  phone: "9876543210",
  loyalty_points: 240,
  tier: "Silver",
  dietary_preferences: ["veg", "sweet"],
  favorite_items: ["p1", "p10", "p6"],
  total_spent: 4280,
  total_orders: 23,
};

export const seedPaymentMethods: PaymentMethodConfig[] = [
  { id: "cash", cafe_id, name: "Cash", enabled: true },
  { id: "card", cafe_id, name: "Card / Digital", enabled: true },
  { id: "upi", cafe_id, name: "UPI QR", enabled: true, upi_id: "dineflow@ybl" },
];
