import type { Client, VoiceChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import { logger } from '@/core/logger';
import figlet from 'figlet'; // ถ้า error ให้เปลี่ยนเป็น: import * as figlet from 'figlet';
import { joinVoiceChannel } from '@discordjs/voice';

export const name = 'ready';
export const once = true;

export async function execute(client: Client<true>) {
  client.user.setPresence({
    activities: [{ name: 'discord.gg/diagonshop' }],
    status: 'online'
  });

  const voiceChannelId = '1268839505885138948';
  const channel = await client.channels.fetch(voiceChannelId).catch(() => null);

  if (!channel || channel.type !== ChannelType.GuildVoice) {
    console.log('❌ ไม่พบ voice channel');
    return;
  }

  console.clear();

  // Banner ตัวใหญ่แบบ App Service
  const banner = figlet.textSync('DEV BY FUJIPP', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  // บรรทัดคำโปรยสไตล์ "APP SERVICE ON LINUX"
  const tagline = 'D I S C O R D   B O T   O N   N O D E . J S';

  // แสดงผล
  console.log(banner);
  console.log(tagline);
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`🖥️  Guilds: ${client.guilds.cache.size}`);
  console.log(
    `🕒 Time: ${
      new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Asia/Bangkok'
      }).format(new Date())
    }`
  );

  // log ปกติไว้ให้เครื่องมือเก็บ log อ่านง่าย
  logger.info({ tag: client.user.tag }, 'Bot is ready');

  const vch = channel as VoiceChannel;
  joinVoiceChannel({
    channelId: vch.id,
    guildId: vch.guild.id,
    adapterCreator: vch.guild.voiceAdapterCreator as unknown as any,
    selfDeaf: false,
    selfMute: true,
  });
}
