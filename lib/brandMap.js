export const BRAND_MAP = {
  samsung:  { label: "Samsung",  category: "Samsung" },
  apple:    { label: "Apple",    category: "Iphone"  }, // backend usa "Iphone"
  xiaomi:   { label: "Xiaomi",   category: "Xiaomi"  },
  motorola: { label: "Motorola", category: "Motorola"},
  huawei:   { label: "Huawei",   category: "Huawei"  },
};

export function toSlug(label) {
  return String(label || "").trim().toLowerCase();
}

export function categoryFromSlug(slug) {
  const key = String(slug || "").toLowerCase();
  return BRAND_MAP[key]?.category || "";
}

export function labelFromSlug(slug) {
  const key = String(slug || "").toLowerCase();
  return BRAND_MAP[key]?.label || slug;
}
