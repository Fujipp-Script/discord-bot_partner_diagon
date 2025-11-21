import { Events, type Interaction } from 'discord.js';
import { handleInteraction } from '@/handlers/interactionHandler';

export const name = Events.InteractionCreate;
export async function execute(i: Interaction) {
  return handleInteraction(i);
}
