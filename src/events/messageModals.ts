import {
  Events,
  ChannelType,
  PermissionFlagsBits,
  type Interaction,
  type GuildTextBasedChannel,
} from 'discord.js';
import { getPendingMap } from '@/shared/pending';

// ===== Helpers =====
function botCanSendIn(channel: GuildTextBasedChannel): boolean {
  const me = channel.guild.members.me;
  if (!me) return false;
  const perms = channel.permissionsFor(me);
  if (!perms) return false;

  if (!perms.has(PermissionFlagsBits.ViewChannel)) return false;

  const isThread =
    'isThread' in channel &&
    typeof (channel as any).isThread === 'function' &&
    (channel as any).isThread();

  if (isThread) return perms.has(PermissionFlagsBits.SendMessagesInThreads);
  return perms.has(PermissionFlagsBits.SendMessages);
}

export const name = Events.InteractionCreate;
export async function execute(interaction: Interaction) {
  if (!interaction.isModalSubmit()) return;

  const id = interaction.customId;

  // ===== modal จาก /message send =====
  if (id.startsWith('message_send:')) {
    const token = id.split(':')[1];
    const map = getPendingMap(interaction.client);
    const state = token ? map.get(token) : undefined;

    const content = interaction.fields.getTextInputValue('message_content')?.trim() ?? '';
    if (!content || content.length > 2000) {
      await interaction.reply({
        content: '❌ ข้อความว่างหรือยาวเกิน 2000 ตัวอักษร กรุณาลองใหม่ครับ',
        ephemeral: true,
      });
      return;
    }

    if (!interaction.guild) {
      await interaction.reply({ content: '❌ ใช้คำสั่งนี้ได้เฉพาะในกิลด์ครับ', ephemeral: true });
      return;
    }

    if (!state || state.userId !== interaction.user.id) {
      await interaction.reply({ content: '❌ เซสชันหมดอายุหรือไม่พบข้อมูลแนบ', ephemeral: true });
      return;
    }

    try {
      const raw = await interaction.client.channels.fetch(state.channelId).catch(() => null);
if (!raw || !('guild' in raw)) {
  map.delete(token);
  await interaction.reply({ content: '❌ ไม่พบห้องปลายทางหรือไม่ใช่ห้องในกิลด์', ephemeral: true });
  return;
}

    if (raw.type === ChannelType.GuildForum) {
  map.delete(token);
  await interaction.reply({
    content: '❌ ห้องปลายทางเป็น Forum — ต้องสร้างกระทู้ก่อนครับ',
    ephemeral: true,
  });
  return;
}

if (!raw.isTextBased()) {
  map.delete(token);
  await interaction.reply({ content: '❌ ห้องปลายทางไม่ใช่ห้องข้อความ', ephemeral: true });
  return;
}


      const textCh = raw as GuildTextBasedChannel;
      if (!botCanSendIn(textCh)) {
        map.delete(token);
        await interaction.reply({
          content: '❌ บอทไม่มีสิทธิ์เพียงพอ (ต้องมี ViewChannel และ SendMessages/SendMessagesInThreads)',
          ephemeral: true,
        });
        return;
      }

      const sent = await textCh.send({
        content,
        files: state.files.length ? state.files.map(f => ({ attachment: f.url, name: f.name })) : undefined,
      });

      map.delete(token);
      await interaction.reply({ content: `✅ ส่งข้อความเรียบร้อย: ${sent.url}`, ephemeral: true });
    } catch {
      map.delete(token);
      await interaction.reply({ content: '❌ ส่งข้อความไม่สำเร็จ (ตรวจสอบสิทธิ์/ชนิดห้อง/ขนาดไฟล์)', ephemeral: true });
    }
    return;
  }

  // ===== modal จาก /message edit =====
  if (id.startsWith('message_edit:')) {
    const messageId = id.split(':')[1];
    const newContent = interaction.fields.getTextInputValue('new_content')?.trim() ?? '';

    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({ content: '❌ คำสั่งนี้ใช้ได้เฉพาะในห้องข้อความครับ', ephemeral: true });
      return;
    }
    if (!newContent || newContent.length > 2000) {
      await interaction.reply({ content: '❌ ข้อความว่างหรือยาวเกิน 2000 ตัวอักษร กรุณาลองใหม่ครับ', ephemeral: true });
      return;
    }

    try {
      const msg = await (interaction.channel as GuildTextBasedChannel).messages.fetch(messageId);
      const botId = interaction.client.user?.id;
      if (!botId || msg.author?.id !== botId) {
        await interaction.reply({ content: '❌ แก้ได้เฉพาะข้อความที่บอทเป็นคนส่งเท่านั้น', ephemeral: true });
        return;
      }

      await msg.edit({ content: newContent });
      await interaction.reply({ content: `✅ แก้ไขเรียบร้อย: ${msg.url}`, ephemeral: true });
    } catch {
      await interaction.reply({ content: '❌ ไม่พบข้อความเป้าหมายในห้องนี้ หรือแก้ไขไม่สำเร็จ', ephemeral: true });
    }
  }
}
