let storageScope = "guest";

export function setStorageScope(userId: string | null) {
  storageScope = userId ?? "guest";
}

export function getStorageScope() {
  return storageScope;
}

export function scopedKey(base: string) {
  return `${base}:${storageScope}`;
}