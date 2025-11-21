import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fg from 'fast-glob';
import { pathToFileURL } from 'url';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DEV_GUILD_ID || '';

async function currentNames() {
  const files = await fg(['src/commands/**/*.ts', 'dist/commands/**/*.js']);
  const names: string[] = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(f).href);
    const c = mod.default ?? mod;
    if (c?.data?.name) names.push(c.data.name);
  }
  return new Set(names);
}

async function main() {
  const rest = new REST({ version: '10' }).setToken(token);
  const names = await currentNames();

  const scope = process.argv.includes('--global') ? 'global' : 'guild';
  const list = scope === 'global'
    ? await rest.get(Routes.applicationCommands(clientId)) as any[]
    : await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as any[];

  const toDelete = list.filter(x => !names.has(x.name));
  for (const cmd of toDelete) {
    if (scope === 'global') await rest.delete(Routes.applicationCommand(clientId, cmd.id));
    else await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
    console.log(`Deleted: ${cmd.name}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
