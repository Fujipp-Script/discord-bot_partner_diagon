import type {
  RepliableInteraction,
  InteractionReplyOptions,
  MessageCreateOptions
} from 'discord.js';

export async function safeReply(
  i: RepliableInteraction,
  options: InteractionReplyOptions
) {
  try {
    if (!i.deferred && !i.replied) {
      return await i.reply(options);
    }
    return await i.followUp(options);
  } catch {
    // DM fallback: แปลง InteractionReplyOptions -> MessageCreateOptions (ตัด ephemeral ทิ้ง)
    const dm: MessageCreateOptions = {
      content: options.content,
      embeds: options.embeds,
      files: options.files,
      components: options.components,
      allowedMentions: options.allowedMentions
    };
    try { await i.user.send(dm); } catch { /* ignore */ }
  }
}
