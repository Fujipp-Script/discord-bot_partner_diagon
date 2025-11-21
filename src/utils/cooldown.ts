export function checkCooldown(store: Map<string, Map<string, number>>, key: string, userId: string, seconds: number) {
  if (!store.has(key)) store.set(key, new Map());
  const bucket = store.get(key)!;
  const now = Date.now();
  const expires = bucket.get(userId) ?? 0;
  if (now < expires) return Math.ceil((expires - now) / 1000);
  bucket.set(userId, now + seconds * 1000);
  return 0;
}
