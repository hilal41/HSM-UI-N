/** Resolves API-served public asset paths (hero images, etc.) for same-origin deployment. */
export function publicAssetUrl(apiBaseUrl: string, path: string | null | undefined): string {
  const trimmed = path?.trim();
  if (!trimmed) {
    return '';
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/configuration-images/${trimmed}`;
  return `${apiBaseUrl}${normalized}`;
}
