/** Generates a unique client-side key; works on HTTP production where crypto.randomUUID is blocked. */
export function newClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      /* non-secure context (e.g. HTTP production) */
    }
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
