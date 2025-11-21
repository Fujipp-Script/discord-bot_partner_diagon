// events/creditMessage.ts
// ✅ Event: นับข้อความผู้ใช้จริง, ลบ reply เก่า, ส่ง reply ใหม่, และรีเนมชื่อห้องตามยอด
import {
  Events,
  ChannelType,
  type Message as DMessage,
  type TextChannel,
  type Collection,
  type Snowflake,
  PermissionFlagsBits,
} from 'discord.js';
import { getChannelId } from '@/features/credit/configStore';
import { CREDIT_REPLIES } from '@/constants/creditReplies';
import { countRealUserMessages } from '@/utils/creditCounter';
import { readReplyCache, writeReplyCache } from '@/utils/creditReplyCache';

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const name = Events.MessageCreate;

export async function execute(message: DMessage) {
  try {
    if (message.author.bot) return;
    if (message.channel.type !== ChannelType.GuildText) return;
    if (!message.guildId) return;

    const allowedChannelId = await getChannelId(message.guildId);
    if (!allowedChannelId) return;
    if (message.channel.id !== allowedChannelId) return;

    const channel = message.channel as TextChannel;

    // ✅ เช็คสิทธิ์เปลี่ยนชื่อห้องก่อน (กัน rename ไม่ติด)
    const me = await message.guild!.members.fetchMe();
    const perms = channel.permissionsFor(me);
    const canRename = perms?.has(PermissionFlagsBits.ManageChannels);

    // 1) นับข้อความผู้ใช้จริงทั้งหมด
    let totalCount = 0;
    try {
      totalCount = await countRealUserMessages(channel);
    } catch (err: any) {
      console.error('❌ นับข้อความไม่สำเร็จ:', err?.message ?? err);
      totalCount = 0;
    }

    // 2) ลบ reply เก่าจาก cache (ถ้ามี)
    const cache = await readReplyCache();
    const prevReplyId = cache[channel.id];
    if (prevReplyId) {
      try {
        const prev = await channel.messages.fetch(prevReplyId).catch(() => null);
        if (prev) await prev.delete().catch(() => {});
      } catch (e: any) {
        console.warn('⚠️ ลบ reply ก่อนหน้าไม่สำเร็จ:', e?.message ?? e);
      }
    }

    // 3) ส่ง reply ใหม่ + จำ id ลง cache
    try {
      const text = pickOne(CREDIT_REPLIES);
      const sent = await message.reply(text);
      cache[channel.id] = sent.id;
      await writeReplyCache(cache);
    } catch (e: any) {
      console.error('❌ ส่ง reply ไม่สำเร็จ:', e?.message ?? e);
    }

    // 4) รีเนมเป็น prefix + ยอด
    const prefix = '╭₊˚ʚ🐉ɞ・มังกรรีวิวบริการㆍ';
    const newName = `${prefix}${totalCount}`;

    if ((!channel.name.startsWith(prefix) || channel.name !== newName) && canRename) {
      try {
        await channel.setName(newName);
      } catch (e: any) {
        console.error('❌ เปลี่ยนชื่อห้องไม่สำเร็จ:', e?.message ?? e);
      }
    }
  } catch (err) {
    console.error('[creditMessage] error:', err);
  }
}
