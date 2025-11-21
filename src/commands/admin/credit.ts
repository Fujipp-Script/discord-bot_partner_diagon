// commands/credit.ts
// ✅ Command: /credit setup (ตั้งห้องทำงาน) และ /credit refresh (อัปเดตไปตอบ “ข้อความผู้ใช้ล่าสุด” + รีเนม)
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
  type Message as DMessage,
} from 'discord.js';
import { setChannelId, getChannelId } from '@/features/credit/configStore';
import { CREDIT_REPLIES } from '@/constants/creditReplies';
import { countRealUserMessages } from '@/utils/creditCounter';
import {
  getPrevReplyId,
  setPrevReplyId,
  readReplyCache,
  writeReplyCache,
} from '@/utils/creditReplyCache';

export const data = new SlashCommandBuilder()
  .setName('credit')
  .setDescription('ตั้งค่าห้องสำหรับระบบนับรีวิว + ตอบสุ่ม + รีเนม')
  .addSubcommand(sc =>
    sc.setName('setup')
      .setDescription('กำหนดห้องที่จะให้ระบบทำงาน')
      .addStringOption(o =>
        o.setName('channelid')
          .setDescription('ID ของ Text Channel')
          .setRequired(true),
      ),
  )
  .addSubcommand(sc =>
    sc.setName('refresh')
      .setDescription('อัปเดตเป็นตอบกลับข้อความผู้ใช้ล่าสุด + รีเนม'),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchLatestNonBotMessage(ch: TextChannel): Promise<DMessage | null> {
  const fetched = await ch.messages.fetch({ limit: 50 });
  for (const m of fetched.values()) {
    if (!m.author.bot) return m as DMessage;
  }
  return null;
}

const PREFIX = '╭₊˚ʚ🐉ɞ・มังกรรีวิวบริการㆍ';

async function handleSetup(i: ChatInputCommandInteraction) {
  const channelId = i.options.getString('channelid', true);
  const ch = await i.guild!.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) {
    return i.editReply('ต้องเป็น **Text Channel** ในกิลด์นี้ครับ');
  }

  // แนะนำสิทธิ์ (ไม่บังคับ)
  const me = await i.guild!.members.fetchMe();
  const perms = (ch as TextChannel).permissionsFor(me);
  if (
    !perms?.has(PermissionFlagsBits.SendMessages) ||
    !perms?.has(PermissionFlagsBits.ReadMessageHistory) ||
    !perms?.has(PermissionFlagsBits.ManageChannels)
  ) {
    await i.followUp({
      ephemeral: true,
      content:
        '⚠️ โปรดให้สิทธิ์บอทในห้องนั้น: **Send Messages**, **Read Message History**, **Manage Channels**',
    }).catch(() => {});
  }

  await setChannelId(i.guild!.id, channelId);
  await i.editReply(`✅ ตั้งค่าห้องเรียบร้อย: <#${channelId}>`);
}

async function handleRefresh(i: ChatInputCommandInteraction) {
  const gid = i.guild!.id;
  const channelId = await getChannelId(gid);
  if (!channelId) return i.editReply('ยังไม่ได้ตั้งค่าห้องด้วย `/credit setup` ครับ');

  const ch = await i.guild!.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) {
    return i.editReply('ห้องที่ตั้งค่าไว้ไม่ใช่ **Text Channel** แล้ว หรือถูกลบไปครับ');
  }
  const channel = ch as TextChannel;

  // เช็คสิทธิ์สำหรับรีเนม
  const me = await i.guild!.members.fetchMe();
  const perms = channel.permissionsFor(me);
  const canRename = perms?.has(PermissionFlagsBits.ManageChannels);

  // 1) ลบ reply เก่า (ถ้ามี)
  try {
    const prevId = await getPrevReplyId(channel.id);
    if (prevId) {
      const prev = await channel.messages.fetch(prevId).catch(() => null);
      if (prev) await prev.delete().catch(() => {});
      // เคลียร์จาก cache (จะเขียน id ใหม่ต่อจากนี้)
      const cache = await readReplyCache();
      delete cache[channel.id];
      await writeReplyCache(cache);
    }
  } catch {
    // ignore
  }

  // 2) หา "ข้อความผู้ใช้ล่าสุด" แล้วตอบกลับ
  const latest = await fetchLatestNonBotMessage(channel);
  if (!latest) {
    await i.editReply('ไม่พบข้อความผู้ใช้ในห้องนี้ให้ตอบกลับครับ');
    return;
  }

  let sentUrl = '';
  try {
    const text = pickOne(CREDIT_REPLIES);
    const sent = await latest.reply(text);
    await setPrevReplyId(channel.id, sent.id);
    sentUrl = sent.url;
  } catch (e: any) {
    return i.editReply(`❌ ส่ง reply ไม่สำเร็จ: ${e?.message ?? e}`);
  }

  // 3) นับยอดและรีเนม
  try {
    const total = await countRealUserMessages(channel);
    const newName = `${PREFIX}${total}`;
    if ((!channel.name.startsWith(PREFIX) || channel.name !== newName) && canRename) {
      await channel.setName(newName).catch(() => {});
    }
    await i.editReply(
      `✅ อัปเดตแล้ว • ตอบกลับล่าสุด: ${sentUrl ? `<${sentUrl}>` : '—'} • ยอดปัจจุบัน: ${total}`,
    );
  } catch (e: any) {
    await i.editReply(`✅ อัปเดตแล้ว แต่รีเนมมีปัญหา: ${e?.message ?? e}`);
  }
}

export async function execute(i: ChatInputCommandInteraction) {
  if (!i.isChatInputCommand() || i.commandName !== 'credit') return;
  if (!i.guild) return i.reply({ content: 'ใช้ในเซิร์ฟเวอร์เท่านั้นครับ', ephemeral: true });

  await i.deferReply({ ephemeral: true });
  const sub = i.options.getSubcommand(true);

  if (sub === 'setup') return handleSetup(i);
  if (sub === 'refresh') return handleRefresh(i);

  await i.editReply('ไม่พบ subcommand ที่รองรับครับ');
}

export default { data, execute };
