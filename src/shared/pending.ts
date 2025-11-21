import type { Client } from 'discord.js';

export type PendingSend = {
  userId: string;
  guildId: string | null;
  channelId: string;
  files: Array<{ url: string; name?: string }>;
};

export const PENDING_KEY = Symbol.for('app.pendingSendMap');

export function getPendingMap(client: Client): Map<string, PendingSend> {
  const anyClient = client as any;
  if (!anyClient[PENDING_KEY]) anyClient[PENDING_KEY] = new Map<string, PendingSend>();
  return anyClient[PENDING_KEY] as Map<string, PendingSend>;
}
