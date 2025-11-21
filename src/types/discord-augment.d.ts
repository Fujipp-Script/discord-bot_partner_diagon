import 'discord.js';

declare module 'discord.js' {
  interface Client {
    commands: import('discord.js').Collection<string, any>;
    buttons: import('discord.js').Collection<string, any>;
    modals: import('discord.js').Collection<string, any>;
    selects: import('discord.js').Collection<string, any>;
    cooldowns: Map<string, Map<string, number>>;
  }
}
