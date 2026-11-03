import type { Product } from "./types";

/** Stock badge colours: green in stock, amber when low (<3), red when out. */
export function stockStyle(p: Pick<Product, "stock">) {
  if (p.stock <= 0) return { label: "Out of stock", fg: "#C81E3A", bg: "#FFEEF0" };
  if (p.stock < 3) return { label: `${p.stock} in stock`, fg: "#A16207", bg: "#FEF5DC" };
  return { label: `${p.stock} in stock`, fg: "#15803D", bg: "#EAF7EE" };
}
