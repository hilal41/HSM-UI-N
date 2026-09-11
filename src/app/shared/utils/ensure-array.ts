/** Coerce nullable arrays for @for / p-table / PrimeNG list bindings. */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Unwrap PagedResponse.items or pass through when already an array. */
export function itemsFromPaged<T>(
  value: { items?: T[] | null } | T[] | null | undefined,
): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return ensureArray(value?.items);
}
