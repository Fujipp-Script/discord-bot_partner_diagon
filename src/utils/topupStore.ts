import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import {
  EmbedBuilder, Guild, ButtonBuilder, ButtonStyle, ActionRowBuilder,
  type GuildMember, type Interaction, type Message
} from 'discord.js';
import { getGuildConfig } from '@/config';

type Entry = { amount: number; count: number };
type Store = Record<string, Entry>;

const FALLBACK_FIRST_ROLE_ID    = '1393550961984929853';
const FALLBACK_UPGRADED_ROLE_ID = '1403399905854357505';

function filePath(guildId: string) {
  return resolve('data/topup', `${guildId}.json`);
}

async function resolveDisplayName(guild: Guild | null | undefined, userId: string) {
  if (guild) {
    const m = await guild.members.fetch(userId).catch(() => null);
    if (m) return m.displayName || m.user.globalName || m.user.username;
  }
  const u = await guild?.client.users.fetch(userId).catch(() => null);
  return u?.globalName || u?.username || `<@${userId}>`;
}

export async function loadData(guildId: string): Promise<Store> {
  try {
    const p = filePath(guildId);
    const raw = JSON.parse(await readFile(p, 'utf-8')) as any;
    const out: Store = {};
    for (const [uid, v] of Object.entries(raw || {})) {
      if (typeof v === 'number') out[uid] = { amount: v as number, count: 0 };
      else out[uid] = { amount: Number((v as any).amount) || 0, count: Number((v as any).count) || 0 };
    }
    return out;
  } catch { return {}; }
}

export async function saveData(guildId: string, data: Store) {
  const p = filePath(guildId);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(data, null, 2), 'utf-8');
}

export function ensureUser(data: Store, userId: string) {
  if (!data[userId]) data[userId] = { amount: 0, count: 0 };
  return data[userId];
}

export function sortEntries(data: Store) {
  return Object.entries(data).sort((a, b) => (b[1].amount - a[1].amount));
}

function thNow() {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Bangkok', hour12: false
  }).format(new Date());
}

// ---- Roles / Thresholds ----
function getTopupCfg(cfg: any) {
  const t = cfg?.topup || {};
  return {
    firstRoleId: t.firstRoleId || FALLBACK_FIRST_ROLE_ID,
    upgradedRoleId: t.upgradedRoleId || FALLBACK_UPGRADED_ROLE_ID,
    thresholds: {
      amount: Number(t?.thresholds?.amount ?? 2000),
      count: Number(t?.thresholds?.count ?? 5),
    }
  };
}
export function shouldUpgrade(e: Entry, cfg?: any) {
  const th = (cfg?.thresholds) ?? { amount: 2000, count: 5 };
  return e.amount >= th.amount || e.count >= th.count;
}
export async function giveFirstRoleIfNeed(member: GuildMember) {
  const cfg = getTopupCfg(await getGuildConfig(member.guild.id));
  if (!cfg.firstRoleId) return;
  if (!member.roles.cache.has(cfg.firstRoleId)) await member.roles.add(cfg.firstRoleId);
}
export async function removeFirstRoleIfNeed(member: GuildMember) {
  const cfg = getTopupCfg(await getGuildConfig(member.guild.id));
  if (!cfg.firstRoleId) return;
  if (member.roles.cache.has(cfg.firstRoleId)) await member.roles.remove(cfg.firstRoleId);
}
export async function giveUpgradeIfNeed(member: GuildMember) {
  const cfg = getTopupCfg(await getGuildConfig(member.guild.id));
  if (!cfg.upgradedRoleId) return;
  if (!member.roles.cache.has(cfg.upgradedRoleId)) await member.roles.add(cfg.upgradedRoleId);
}

// ---- Business ----
export async function addAmount(guildId: string, userId: string, amount: number) {
  const data = await loadData(guildId);
  const e = ensureUser(data, userId);
  const isFirstTime = e.count === 0;
  e.amount += amount;
  e.count += 1;
  await saveData(guildId, data);
  return { entry: e, isFirstTime };
}

export async function listPageEmbed(guildId: string, page: number, size = 20) {
  const data = await loadData(guildId);
  const sorted = sortEntries(data);
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const cur = Math.min(Math.max(1, page), pages);
  const start = (cur - 1) * size;
  const items = sorted.slice(start, start + size);

  const lines = items.map(([uid, e], idx) => {
    const n = start + idx + 1;
    return `\`${n}.\` <@${uid}> → \`${e.amount} บาท\` • \`${e.count} ครั้ง\``;
  });
  const embed = new EmbedBuilder()
    .setColor('#E46DAF')
    .setTitle('<:Customer_1:1397770440293879991> อันดับการใช้เงิน')
    .setDescription(lines.join('\n') || '— ว่าง —')
    .setFooter({ text: `page ${cur}/${pages}` })
    .setTimestamp(new Date());

  return { embed, page: cur, pages };
}

export function pageControls(page: number, pages: number) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('topup_list_prev')
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('topup_list_next')
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pages)
  );
}
export function parsePageFromEmbed(msg: Message) {
  const ft = msg.embeds?.[0]?.footer?.text || '';
  const m = ft.match(/page\s+(\d+)\/(\d+)/i);
  const page = m ? Number(m[1]) : 1;
  const pages = m ? Number(m[2]) : 1;
  return { page, pages };
}

export async function totalEmbed(guildId: string) {
  const data = await loadData(guildId);
  let totalAmount = 0, totalCount = 0;
  for (const e of Object.values(data)) { totalAmount += e.amount || 0; totalCount += e.count || 0; }
  return new EmbedBuilder()
    .setColor('#E46DAF')
    .setTitle('<:Treasure:1398066484911276082> ยอดรวมทั้งหมด')
    .setDescription(`รวมยอดเงินทั้งหมด: \`${totalAmount}\` บาท\nรวมจำนวนครั้งทั้งหมด: \`${totalCount}\` ครั้ง`)
    .setTimestamp(new Date());
}

// ---- Embeds (สไตล์การ์ดสมาชิกตามที่ให้) ----
export async function buildCardEmbed(
  i: Interaction, userId: string, todayAmount: number, totalAmount: number, totalCount: number, isFirst: boolean
) {
  const guild = (i as any).guild ?? null;
  const name = await resolveDisplayName(guild, userId);

  return new EmbedBuilder()
    .setColor('#E46DAF')
    .setTitle(`<a:6488dripcheckmark:1403752646720098365> บัตรสมาชิกของร้านไอด้า คุณ ${name}`)
    .setDescription(
      `${isFirst ? '<a:659c1e89e0ba:1395735285580693545>  \`ขอบคุณนะคะสำหรับการใช้บริการครั้งแรก !!\`\n' : ''}` +
      `<a:money1:1393986817212026965>﹕ค่าใช้จ่ายวันนี้﹕\`${todayAmount}\` บาท\n` +
      `<:mimu_tickets:1396809986092433498>﹕รวมยอดสะสมทั้งหมด﹕ \`${totalAmount}\` บาท\n` +
      `‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿‿\n\n` +
      `<a:964142615320752138:1404024970396307529>ลูกค้าได้รับแต้มสะสม ครั้งที่ \`${totalCount}\` \n` +
      `-# 𝗍𝗁𝖺𝗇𝗄𝗌 𝗒𝗈𝗎 𝖿𝗈𝗋 𝗌𝗎𝗉𝗉𝗈𝗋𝗍 𝗆𝖾.`
    )
    .setThumbnail('https://cdn.discordapp.com/attachments/1400405147875807352/1404563530405118113/955015062530175066.png?ex=689ba539&is=689a53b9&hm=6051ec9710a95f16885fd001cff0336a0d0ba211df1a13d9cab90737011f11fe&')
    .setTimestamp(new Date());
}

// ---- Utils ----
export function toUserId(input?: string) {
  if (!input) return '';
  const m = input.match(/\d{16,20}/g);
  return m?.[0] ?? '';
}

export function buildInfoEmbed(title: string, description: string, color: number = 0x00AE86) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}
