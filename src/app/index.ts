import { client } from '@/core/client';
import { env } from '@/core/env';
import { logger } from '@/core/logger';

import { loadCommands } from '@/loaders/commandLoader';
import { loadInteractions } from '@/loaders/interactionLoader';
import { loadEvents } from '@/loaders/eventLoader';
import { loadJobs } from '@/loaders/jobLoader';
import { startWeb } from '@/web/server';

async function bootstrap() {
  await Promise.all([loadCommands(), loadInteractions(), loadEvents(), loadJobs()]);
  if (env.RUN_WEB) startWeb();
  await client.login(env.DISCORD_TOKEN);
  logger.info('Logged in');
}

bootstrap().catch((e) => {
  logger.fatal({ err: e }, 'Boot failed');
  process.exit(1);
});
