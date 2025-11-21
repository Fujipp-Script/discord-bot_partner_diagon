// utils/creditCounter.ts
import {
  type TextChannel,
  type Collection,
  type Snowflake,
  type Message as DMessage,
} from 'discord.js';

export async function countRealUserMessages(channel: TextChannel): Promise<number> {
  let lastId: string | undefined;
  let total = 0;

  while (true) {
    const fetched = (await channel.messages.fetch({
      limit: 100,
      ...(lastId ? { before: lastId } : {}),
    })) as Collection<Snowflake, DMessage>;

    if (fetched.size === 0) break;
    fetched.forEach((m) => { if (!m.author.bot) total += 1; });
    lastId = fetched.last()?.id;
    if (!lastId) break;
  }
  return total;
}
