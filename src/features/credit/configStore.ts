import path from 'path';
import { readJSON, writeJSON } from '@/utils/jsonStore';

const DATA = path.resolve('data/credit.channel.json');

type GuildChannelMap = Record<string, string>; // guildId -> channelId

export async function getChannelId(guildId: string) {
  const map = await readJSON<GuildChannelMap>(DATA, {});
  return map[guildId];
}

export async function setChannelId(guildId: string, channelId: string) {
  const map = await readJSON<GuildChannelMap>(DATA, {});
  map[guildId] = channelId;
  await writeJSON(DATA, map);
  return channelId;
}
