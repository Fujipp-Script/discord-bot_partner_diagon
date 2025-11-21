import type { ChatInputCommandInteraction } from 'discord.js';
import { handleError } from './errorHandler';
import { checkCooldown } from '@/utils/cooldown';

export async function handleCommand(i: ChatInputCommandInteraction) {
  const cmd = i.client.commands.get(i.commandName);
  if (!cmd) return;

  try {
    // cooldown (ค่าเริ่ม 3 วิ ถ้า command ไม่กำหนดเอง)
    const cd = cmd.cooldown ?? 3;
    const now = checkCooldown(i.client.cooldowns, `cmd:${i.commandName}`, i.user.id, cd);
    if (now > 0) {
      return i.reply({ ephemeral: true, content: `โปรดรออีก ${now}s ก่อนใช้คำสั่งนี้ซ้ำ` });
    }

    // permissions (optional: cmd.requiredMemberPerms / cmd.requiredBotPerms)
    if (cmd.checkPermissions) await cmd.checkPermissions(i);

    await cmd.execute(i);
  } catch (err) {
    await handleError(i, err);
  }
}
