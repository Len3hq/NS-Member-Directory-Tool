import type { Member } from '@/types';

// Discord embed color (NS brand purple-ish)
const EMBED_COLOR = 0x5865f2;

const STATUS_MAP: Record<string, { icon: string; label: string }> = {
  on_campus:  { icon: '✅', label: 'On Campus' },
  off_campus: { icon: '📍', label: 'Off Campus' },
};

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Formats the agent reply + matched member cards into a Discord message with embeds.
 */
export function formatDiscordReply(reply: string, members: Member[]): DiscordMessage {
  const embeds: DiscordEmbed[] = [];

  if (members.length > 0) {
    for (const m of members.slice(0, 3)) {
      const { icon: statusIcon, label: statusLabel } =
        STATUS_MAP[m.status] ?? { icon: '📍', label: 'Off Campus' };

      const fields: DiscordEmbed['fields'] = [
        {
          name: 'Specialty',
          value: `${m.specialty}`,
          inline: true,
        },
        {
          name: 'Status',
          value: `${statusIcon} ${statusLabel}`,
          inline: true,
        },
      ];

      if (m.building) {
        fields.push({ name: 'Building', value: m.building, inline: false });
      }

      const contacts: string[] = [];
      if (m.email_visible && m.email) contacts.push(`✉ ${m.email}`);
      if (m.social_links?.twitter) contacts.push(`[𝕏 Twitter](${m.social_links.twitter})`);
      if (m.social_links?.linkedin) contacts.push(`[LinkedIn](${m.social_links.linkedin})`);
      if (m.social_links?.github) contacts.push(`[GitHub](${m.social_links.github})`);
      if (m.social_links?.website) contacts.push(`[Website](${m.social_links.website})`);
      if (m.social_links?.discord) contacts.push(`Discord: ${m.social_links.discord}`);
      if (contacts.length > 0) {
        fields.push({ name: 'Contact', value: contacts.join(' · '), inline: false });
      }

      embeds.push({
        title: `👤 ${m.name}`,
        color: EMBED_COLOR,
        fields,
        ...(embeds.length === members.slice(0, 3).length - 1
          ? { footer: { text: 'NS Member Directory' } }
          : {}),
      });
    }
  }

  // Add footer to the last embed if we have embeds
  if (embeds.length > 0) {
    embeds[embeds.length - 1].footer = { text: 'NS Member Directory' };
  }

  return {
    content: reply,
    ...(embeds.length > 0 ? { embeds } : {}),
  };
}
