import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

const root = resolve('data/config'); // เก็บไฟล์จริง
type GuildConfig = Record<string, any>;

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  try {
    const p = resolve(root, `${guildId}.json`);
    const raw = await readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {}; // ค่าเริ่มต้นว่าง
  }
}

export async function setGuildConfig(guildId: string, cfg: GuildConfig) {
  const p = resolve(root, `${guildId}.json`);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(cfg, null, 2), 'utf-8');
}
