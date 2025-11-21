import { client } from '@/core/client';
import { importModules } from '@/utils/fileSystem';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function loadInteractions() {
  client.buttons.clear();
  client.modals.clear();
  client.selects.clear();

  const here = fileURLToPath(import.meta.url);
  const inDist = here.includes(`${path.sep}dist${path.sep}`);

  const btns = await importModules(inDist ? ['dist/interactions/buttons/**/*.js']
                                          : ['src/interactions/buttons/**/*.ts']);
  for (const { mod } of btns) {
    const id = mod.customId ?? mod.default?.customId;
    const execute = mod.execute ?? mod.default?.execute;
    if (id && typeof execute === 'function') client.buttons.set(id, execute);
  }

  const modals = await importModules(inDist ? ['dist/interactions/modals/**/*.js']
                                            : ['src/interactions/modals/**/*.ts']);
  for (const { mod } of modals) {
    const id = mod.customId ?? mod.default?.customId;
    const execute = mod.execute ?? mod.default?.execute;
    if (id && typeof execute === 'function') client.modals.set(id, execute);
  }

  const selects = await importModules(inDist ? ['dist/interactions/selects/**/*.js']
                                             : ['src/interactions/selects/**/*.ts']);
  for (const { mod } of selects) {
    const id = mod.customId ?? mod.default?.customId;
    const execute = mod.execute ?? mod.default?.execute;
    if (id && typeof execute === 'function') client.selects.set(id, execute);
  }
}
