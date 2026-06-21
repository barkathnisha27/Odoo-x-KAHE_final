import { Product } from "./types";

export function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = `${product.cafe_id || "demo"}|${String(product.name || "").trim().toLowerCase()}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeNavItems<T extends { to?: string; path?: string; label?: string; name?: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = String(item.to || item.path || item.label || item.name || "").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
