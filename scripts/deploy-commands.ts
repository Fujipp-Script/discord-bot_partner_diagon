import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fg from 'fast-glob';
import { pathToFileURL } from 'url';
import fs from 'node:fs';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const isGuild = process.argv.includes('--guild');
const useDist = process.argv.includes('--dist');   // <-- เลือกโหลดจาก dist
const dryRun  = process.argv.includes('--dry');    // <-- ดูรายการเฉย ๆ ไม่อัปโหลด
const guildId = isGuild ? (process.env.DEV_GUILD_ID || '') : '';

type CmdJSON = { name: string; type?: number } & Record<string, any>;

function resolvePatterns(): string[] {
  // เลือกแหล่งเดียวให้ชัดเจน ป้องกันโหลดซ้ำ
  if (useDist) return ['dist/commands/**/*.js'];
  // ถ้าไม่ได้ส่ง --dist ให้ใช้ src; กันเผลอโหลดทั้งคู่
  return ['src/commands/**/*.ts'];
}

async function collect(): Promise<{ file: string; json: CmdJSON }[]> {
  const patterns = resolvePatterns();
  const files = await fg(patterns, { dot: false, unique: true });
  const out: { file: string; json: CmdJSON }[] = [];

  for (const f of files) {
    const mod = await import(pathToFileURL(f).href);
    const c = (mod.default ?? mod) as any;
    const json = c?.data?.toJSON?.() as CmdJSON | undefined;
    if (json) out.push({ file: f, json });
  }
  return out;
}

function assertNoDuplicates(items: { file: string; json: CmdJSON }[]) {
  // Discord บังคับชื่อไม่ซ้ำ (พิจารณา type ด้วย: 1=slash, 2=user, 3=message)
  const keyOf = (j: CmdJSON) => `${j.name}:${j.type ?? 1}`;
  const seen = new Map<string, { first: string; others: string[] }>();

  for (const it of items) {
    const k = keyOf(it.json);
    const cur = seen.get(k);
    if (!cur) seen.set(k, { first: it.file, others: [] });
    else cur.others.push(it.file);
  }

  const dups = [...seen.entries()].filter(([, v]) => v.others.length > 0);
  if (dups.length) {
    console.error('❌ Duplicate command names detected:\n');
    for (const [k, v] of dups) {
      console.error(`- ${k}`);
      console.error(`  first : ${v.first}`);
      v.others.forEach((f, i) => console.error(`  dup #${i + 1}: ${f}`));
    }
    throw new Error('Duplicate command names. Please rename or consolidate (use subcommands).');
  }
}

async function main() {
  if (!token || !clientId) throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  if (isGuild && !guildId) throw new Error('Missing DEV_GUILD_ID for --guild');

  const entries = await collect();

  // แสดงรายการก่อนอัปโหลด (ช่วยไล่ debug)
  console.table(
    entries.map((e, i) => ({
      idx: i,
      name: e.json.name,
      type: e.json.type ?? 1,
      file: e.file,
    }))
  );

  // กันชื่อซ้ำแบบชัดเจน
  assertNoDuplicates(entries);

  const body = entries.map((e) => e.json);

  if (dryRun) {
    console.log(`🧪 DRY RUN – would register ${body.length} command(s).`);
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  if (isGuild) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log(`✅ Registered ${body.length} guild command(s) to ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`✅ Registered ${body.length} global command(s)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
