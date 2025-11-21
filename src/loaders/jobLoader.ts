import cron from 'node-cron';
import { importModules } from '@/utils/fileSystem';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function loadJobs() {
  const here = fileURLToPath(import.meta.url);
  const inDist = here.includes(`${path.sep}dist${path.sep}`);
  const patterns = inDist ? ['dist/jobs/**/*.js'] : ['src/jobs/**/*.ts'];

  const modules = await importModules(patterns);
  for (const { mod } of modules) {
    const job = mod.default ?? mod;
    if (!job?.schedule || typeof job.run !== 'function') continue;
    cron.schedule(job.schedule, () => job.run().catch(() => {}));
  }
}
