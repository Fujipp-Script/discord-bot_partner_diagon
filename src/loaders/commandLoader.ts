import { client } from '@/core/client';
import { importModules } from '@/utils/fileSystem';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function loadCommands() {
  client.commands.clear();

  const here = fileURLToPath(import.meta.url);
  const inDist = here.includes(`${path.sep}dist${path.sep}`);
  const patterns = inDist ? ['dist/commands/**/*.js'] : ['src/commands/**/*.ts'];

  const modules = await importModules(patterns);
  for (const { mod } of modules) {
    const cmd = mod.default ?? mod;
    if (!cmd?.data?.name || typeof cmd.execute !== 'function') continue;
    client.commands.set(cmd.data.name, cmd);
  }
}
