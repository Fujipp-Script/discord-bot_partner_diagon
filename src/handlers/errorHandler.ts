import { logger } from '@/core/logger';
import { baseEmbed, safeReply } from '@/utils';
import { randomUUID } from 'crypto';

export async function handleError(i: any, err: unknown) {
  const id = randomUUID();
  logger.error({ err, id }, 'Interaction error');
  await safeReply(i, {
    ephemeral: true,
    embeds: [baseEmbed({ title: 'เกิดข้อผิดพลาด', description: `รหัสอ้างอิง: \`${id}\`` })]
  });
}
