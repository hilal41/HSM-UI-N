/**
 * Formats shared page titles as PascalCase words (Title Case).
 * Example: "stock purchases" → "Stock Purchases", "rx queue" → "Rx Queue".
 * Keeps short all-caps tokens (POS, OPD, IPD) unchanged.
 */
export function toPascalTitle(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g, (word) => {
    if (word.length <= 4 && word === word.toUpperCase()) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}
