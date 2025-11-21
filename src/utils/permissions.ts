// src/utils/permissions.ts
import {
  PermissionFlagsBits,
  PermissionsBitField,
  type GuildMember,
  type APIInteractionGuildMember
} from 'discord.js';

type AnyMember = GuildMember | APIInteractionGuildMember | null;

export function hasAll(member: AnyMember, ...perms: (keyof typeof PermissionFlagsBits)[]) {
  if (!member) return false;

  const need = new PermissionsBitField(perms.map(p => PermissionFlagsBits[p]));
  const current = 'permissions' in (member as any)
    ? new PermissionsBitField((member as APIInteractionGuildMember).permissions as any) // from API payload
    : (member as GuildMember).permissions; // full GuildMember

  return current.has(need);
}

export function ensurePermissions(member: AnyMember, perms: (keyof typeof PermissionFlagsBits)[]) {
  if (!hasAll(member, ...perms)) {
    const list = perms.join(', ');
    throw new Error(`ต้องการสิทธิ์: ${list}`);
  }
}
