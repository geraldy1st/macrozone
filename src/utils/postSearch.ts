/**
 * Sanitize free-text search for PostgREST `or` / `ilike` filters.
 * Strips characters that break the filter grammar.
 */
export function sanitizePostSearchTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[%_,."'()\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a PostgREST `.or(...)` filter for meal_name + caption ilike search.
 * Returns null when the term is empty after sanitization.
 */
export function buildPostSearchOrFilter(rawQuery: string): string | null {
  const term = sanitizePostSearchTerm(rawQuery);
  if (!term) {
    return null;
  }

  const pattern = `%${term}%`;
  return `meal_name.ilike.${pattern},caption.ilike.${pattern}`;
}
