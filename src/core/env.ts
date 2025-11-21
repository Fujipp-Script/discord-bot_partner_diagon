import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DEV_GUILD_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),
  RUN_WEB: z.coerce.boolean().default(true),
  PORT: z.coerce.number().default(3000),
  USE_MESSAGE_CONTENT: z.coerce.boolean().default(false),
  USE_GUILD_MEMBERS: z.coerce.boolean().default(true),
  PRIMARY_COLOR: z.string().default('#7987AC'),
});

export const env = EnvSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
