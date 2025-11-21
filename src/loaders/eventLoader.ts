import { client } from '@/core/client';
import { importModules } from '@/utils/fileSystem';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function loadEvents() {
  const here = fileURLToPath(import.meta.url);
  const inDist = here.includes(`${path.sep}dist${path.sep}`);
  const patterns = inDist ? ['dist/events/**/*.js'] : ['src/events/**/*.ts'];

  const modules = await importModules(patterns);
  for (const { mod } of modules) {
    const name = mod.name ?? mod.default?.name;
    const once = mod.once ?? mod.default?.once;
    const execute = mod.execute ?? mod.default?.execute;
    if (!name || typeof execute !== 'function') continue;

    if (once) client.once(name, (...args) => execute(...args));
    else client.on(name, (...args) => execute(...args));
  }
}
