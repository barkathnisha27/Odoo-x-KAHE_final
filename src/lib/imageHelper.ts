export function getProductImage(name: string, category: string = ""): string {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // Coffee & Hot Drinks
  if (n.includes("cappuccino") || n.includes("latte") || n.includes("mocha") || c.includes("coffee")) {
    return "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("espresso")) {
    return "https://images.unsplash.com/photo-1510061164627-6f17e06825c0?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("tea") || n.includes("chai")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800&auto=format&fit=crop";
  }

  // Cold Drinks
  if (n.includes("juice") || n.includes("smoothie") || c.includes("cold")) {
    return "https://images.unsplash.com/photo-1622597467836-f3285f2131b7?q=80&w=800&auto=format&fit=crop";
  }

  // Fast Food / Burgers
  if (n.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("fries")) {
    return "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=800&auto=format&fit=crop";
  }

  // Snacks & Bakery
  if (n.includes("samosa")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("brownie") || n.includes("cake") || n.includes("pastry")) {
    return "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=800&auto=format&fit=crop";
  }
  if (n.includes("croissant")) {
    return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop";
  }

  // Fallback / Defaults
  return "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=800&auto=format&fit=crop";
}
