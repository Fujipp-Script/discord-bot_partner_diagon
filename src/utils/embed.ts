import { EmbedBuilder, type APIEmbed } from 'discord.js';
import { env } from '@/core/env';

export function baseEmbed(data?: Partial<APIEmbed>) {
  return new EmbedBuilder({ color: Number.parseInt(env.PRIMARY_COLOR.replace('#',''), 16), ...data });
}
