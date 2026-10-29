export type StudyStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { keyFor: (key: string) => string };
// The original keys belong to the local visitor. Never silently claim/import them.
export function scopedStorage(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, accountId: string | null): StudyStorage {
  const keyFor = (key: string) => accountId ? `em-account:${encodeURIComponent(accountId)}:${key}` : key;
  return { keyFor, getItem: key => storage.getItem(keyFor(key)), setItem: (key, value) => storage.setItem(keyFor(key), value), removeItem: key => storage.removeItem(keyFor(key)) };
}
