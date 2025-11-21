import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type ModalActionRowComponentBuilder,
  type Attachment,
} from 'discord.js';
import { getPendingMap } from '@/shared/pending';

// ===== Helpers =====
async function resolveTextChannelFromOption(
  interaction: ChatInputCommandInteraction,
  optionName: string
): Promise<GuildTextBasedChannel | null> {
  const picked = interaction.options.getChannel(optionName, true);
  if (!interaction.guild) return null;

  // ใช้ client.fetch เพื่อครอบคลุม Thread ด้วย
  const raw = await interaction.client.channels.fetch(picked.id).catch(() => null);
if (!raw || !('guild' in raw)) return null;
 if (raw.type === ChannelType.GuildForum) return null;

if (!raw.isTextBased()) return null;
return raw as GuildTextBasedChannel;
}

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

// ===== Slash data =====
export const data = new SlashCommandBuilder()
  .setName('message')
  .setDescription('ส่งหรือแก้ไขข้อความผ่าน Modal / แนบไฟล์')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

  // --- send ---
  .addSubcommand((sub) =>
    sub
      .setName('send')
      .setDescription('ส่งข้อความ (ผ่าน Modal) ไปยังห้องที่กำหนด, แนบไฟล์ได้')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('ห้องที่จะส่งข้อความ')
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread
          )
          .setRequired(true),
      )
      .addAttachmentOption((opt) =>
        opt
          .setName('file')
          .setDescription('ไฟล์แนบ (ไม่บังคับ)')
          .setRequired(false),
      ),
  )

  // --- sendfile ---
  .addSubcommand((sub) =>
    sub
      .setName('sendfile')
      .setDescription('ส่งไฟล์อย่างเดียวไปยังห้องที่กำหนด (มี caption ได้)')
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('ห้องที่จะส่งไฟล์')
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread
          )
          .setRequired(true),
      )
      .addAttachmentOption((opt) =>
        opt
          .setName('file')
          .setDescription('ไฟล์แนบ (จำเป็น)')
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName('caption')
          .setDescription('ข้อความประกอบไฟล์ (ไม่บังคับ)')
          .setRequired(false),
      ),
  )

  // --- edit ---
  .addSubcommand((sub) =>
    sub
      .setName('edit')
      .setDescription('แก้ไขข้อความที่มีอยู่ (ในห้องปัจจุบัน)')
      .addStringOption((opt) =>
        opt
          .setName('messageid')
          .setDescription('Message ID ของข้อความที่จะถูกแก้ไข')
          .setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand(true);

  // ===== /message send =====
  if (sub === 'send') {
    const file = interaction.options.getAttachment('file', false) as Attachment | null;

    if (!interaction.guild) {
      await interaction.reply({ content: '❌ ใช้คำสั่งนี้ได้เฉพาะในกิลด์ครับ', ephemeral: true });
      return;
    }

    const target = await resolveTextChannelFromOption(interaction, 'channel');
    if (!target) {
      await interaction.reply({
        content: '❌ ห้องปลายทางไม่ใช่ห้องข้อความในกิลด์ หรือเป็น Forum (ต้องสร้างกระทู้ก่อน)',
        ephemeral: true,
      });
      return;
    }

    const token = interaction.id;
    const map = getPendingMap(interaction.client);
    map.set(token, {
      userId: interaction.user.id,
      guildId: interaction.guildId ?? null,
      channelId: target.id,
      files: file ? [{ url: file.url, name: file.name }] : [],
    });

    const modal = new ModalBuilder()
      .setCustomId(`message_send:${token}`)
      .setTitle('พิมพ์ข้อความที่จะส่ง');

    const input = new TextInputBuilder()
      .setCustomId('message_content')
      .setLabel('ข้อความที่จะส่ง (≤ 2000 ตัวอักษร)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
    return;
  }

  // ===== /message sendfile =====
  if (sub === 'sendfile') {
    const file = interaction.options.getAttachment('file', true) as Attachment;
    const caption = interaction.options.getString('caption') ?? undefined;

    const target = await resolveTextChannelFromOption(interaction, 'channel');
    if (!target) {
      await interaction.reply({
        content: '❌ ห้องปลายทางไม่ใช่ห้องข้อความในกิลด์ หรือเป็น Forum (ต้องสร้างกระทู้ก่อน)',
        ephemeral: true,
      });
      return;
    }

    if (!botCanSendIn(target)) {
      await interaction.reply({
        content: '❌ บอทไม่มีสิทธิ์เพียงพอ (ต้องมี ViewChannel และ SendMessages/SendMessagesInThreads)',
        ephemeral: true,
      });
      return;
    }

    try {
      const sent = await target.send({
        content: caption,
        files: [{ attachment: file.url, name: file.name }],
      });
      await interaction.reply({ content: `✅ ส่งไฟล์เรียบร้อย: ${sent.url}`, ephemeral: true });
    } catch {
      await interaction.reply({
        content: '❌ ส่งไฟล์ไม่สำเร็จ (อาจติดสิทธิ์หรือขนาดไฟล์เกิน)',
        ephemeral: true,
      });
    }
    return;
  }

  // ===== /message edit =====
  if (sub === 'edit') {
    const messageId = interaction.options.getString('messageid', true);

    const ch = interaction.channel;
    if (!ch || !ch.isTextBased()) {
      await interaction.reply({ content: '❌ คำสั่งนี้ใช้ได้เฉพาะในห้องข้อความครับ', ephemeral: true });
      return;
    }

    try {
      const msg = await (ch as GuildTextBasedChannel).messages.fetch(messageId);
      const botId = interaction.client.user?.id;
      if (!botId || msg.author?.id !== botId) {
        await interaction.reply({ content: '❌ แก้ได้เฉพาะข้อความที่บอทเป็นคนส่งเท่านั้น', ephemeral: true });
        return;
      }

      const modal = new ModalBuilder()
        .setCustomId(`message_edit:${messageId}`)
        .setTitle('แก้ไขข้อความ');

      const input = new TextInputBuilder()
        .setCustomId('new_content')
        .setLabel('ข้อความใหม่ (≤ 2000 ตัวอักษร)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue((msg.content ?? '').slice(0, 2000));

      const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    } catch {
      await interaction.reply({ content: '❌ ไม่พบข้อความนั้นในห้องนี้', ephemeral: true });
    }
    return;
  }
}
