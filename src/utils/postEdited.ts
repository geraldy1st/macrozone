/** Treat as edited when updated_at is meaningfully after created_at. */
const EDIT_THRESHOLD_MS = 3000;

export function isPostEdited(
  createdAt?: string | null,
  updatedAt?: string | null,
): boolean {
  if (!createdAt || !updatedAt) {
    return false;
  }

  const created = Date.parse(createdAt);
  const updated = Date.parse(updatedAt);

  if (Number.isNaN(created) || Number.isNaN(updated)) {
    return false;
  }

  return updated - created > EDIT_THRESHOLD_MS;
}
