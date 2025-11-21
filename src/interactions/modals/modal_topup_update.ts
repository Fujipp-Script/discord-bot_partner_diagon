import type { ModalSubmitInteraction } from 'discord.js';
import {
  toUserId, loadData, saveData, ensureUser, buildInfoEmbed,
  shouldUpgrade, removeFirstRoleIfNeed, giveUpgradeIfNeed
} from '@/utils/topupStore';

export const customId = 'modal_topup_update';

export async function execute(i: ModalSubmitInteraction) {
  const gid = i.guildId!;
  const uid = toUserId(i.fields.getTextInputValue('user_id')?.trim());
  if (!uid) return i.reply({ ephemeral: true, content: '❌ ต้องระบุผู้ใช้ให้ถูกต้อง' });

  const amountStr = i.fields.getTextInputValue('amount')?.trim();
  const countStr  = i.fields.getTextInputValue('count')?.trim();

  await i.deferReply({ ephemeral: true });

  const data = await loadData(gid);
  const e = ensureUser(data, uid);

  if (amountStr) e.amount = Math.max(0, Number(amountStr) || 0);
  if (countStr)  e.count  = Math.max(0, Number(countStr)  || 0);

  await saveData(gid, data);

  // อัปเดตยศตามเงื่อนไข
  const member = await i.guild!.members.fetch(uid).catch(() => null);
  if (member && shouldUpgrade(e)) {
    await removeFirstRoleIfNeed(member).catch(() => {});
    await giveUpgradeIfNeed(member).catch(() => {});
  }

  await i.editReply({
    embeds: [buildInfoEmbed('✅ อัปเดตยอดสำเร็จ', `ตั้งค่า <@${uid}> → \`${e.amount}\` บาท • \`${e.count}\` ครั้ง`)]
  });
}
