// utils/creditReplyCache.ts
import path from 'path';
import { readJSON, writeJSON } from '@/utils/jsonStore';

export const REPLY_CACHE_PATH = path.resolve('data/ida_credit_reply.json');
export type ReplyCache = Record<string, string>;

export async function readReplyCache(): Promise<ReplyCache> {
  return await readJSON<ReplyCache>(REPLY_CACHE_PATH, {});
}

export async function writeReplyCache(cache: ReplyCache) {
  await writeJSON(REPLY_CACHE_PATH, cache);
}

export async function getPrevReplyId(channelId: string) {
  const cache = await readReplyCache();
  return cache[channelId];
}

export async function setPrevReplyId(channelId: string, messageId: string) {
  const cache = await readReplyCache();
  cache[channelId] = messageId;
  await writeReplyCache(cache);
}

export async function deletePrevReplyId(channelId: string) {
  const cache = await readReplyCache();
  delete cache[channelId];
  await writeReplyCache(cache);
}
