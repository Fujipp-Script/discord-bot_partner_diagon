import {
  Client, GatewayIntentBits, Partials, Collection,
  type ButtonInteraction, type ModalSubmitInteraction, type StringSelectMenuInteraction
} from 'discord.js';
import { env } from './env';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    ...(env.USE_GUILD_MEMBERS ? [GatewayIntentBits.GuildMembers] : []),
    ...(env.USE_MESSAGE_CONTENT ? [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] : [])
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember]
}) as Client & {
  commands: Collection<string, any>;
  buttons: Collection<string, (i: ButtonInteraction) => Promise<any>>;
  modals: Collection<string, (i: ModalSubmitInteraction) => Promise<any>>;
  selects: Collection<string, (i: StringSelectMenuInteraction) => Promise<any>>;
  cooldowns: Map<string, Map<string, number>>;
};

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.selects = new Collection();
client.cooldowns = new Map();
