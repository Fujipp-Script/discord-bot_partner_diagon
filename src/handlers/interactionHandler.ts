import {
  ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction, Interaction
} from 'discord.js';
import { handleError } from './errorHandler';
import { handleCommand } from './commandHandler';

export async function handleInteraction(i: Interaction) {
  try {
    if (i.isChatInputCommand())       return handleCommand(i as ChatInputCommandInteraction);
    if (i.isButton()) {
      const h = i.client.buttons.get(i.customId);
      if (h) return h(i as ButtonInteraction);
    }
    if (i.isModalSubmit()) {
      const h = i.client.modals.get(i.customId);
      if (h) return h(i as ModalSubmitInteraction);
    }
    if (i.isStringSelectMenu()) {
      const h = i.client.selects.get(i.customId);
      if (h) return h(i as StringSelectMenuInteraction);
    }
  } catch (err) {
    await handleError(i as any, err);
  }
}
