import type { ButtonInteraction } from 'discord.js';
import { parsePageFromEmbed, listPageEmbed, pageControls } from '@/utils/topupStore';

export const customId = 'topup_list_next';

export async function execute(i: ButtonInteraction) {
  const cur = parsePageFromEmbed(i.message);
  const nextPage = Math.min(cur.pages, cur.page + 1);
  const { embed, page, pages } = await listPageEmbed(i.guildId!, nextPage, 20);
  await i.update({ embeds: [embed], components: [pageControls(page, pages)] });
}
