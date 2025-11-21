import type { ModalSubmitInteraction } from 'discord.js';
import { toUserId, loadData, saveData, buildInfoEmbed } from '@/utils/topupStore';

export const customId = 'modal_topup_delete';

export async function execute(i: ModalSubmitInteraction) {
  const gid = i.guildId!;
  const uid = toUserId(i.fields.getTextInputValue('user_id')?.trim());
  if (!uid) return i.reply({ ephemeral: true, content: '❌ ต้องระบุผู้ใช้ให้ถูกต้อง' });

  await i.deferReply({ ephemeral: true });

  const data = await loadData(gid);
  if (data[uid]) {
    delete data[uid];
    await saveData(gid, data);
    await i.editReply({ embeds: [buildInfoEmbed('ลบข้อมูลสำเร็จ', `ลบข้อมูลของ <@${uid}> เรียบร้อย`)] });
  } else {
    await i.editReply('ไม่พบข้อมูลของผู้ใช้นี้');
  }
}
