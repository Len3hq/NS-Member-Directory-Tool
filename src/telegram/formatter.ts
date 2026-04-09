import type { Member } from '@/types';

const MAX_LENGTH = 4096; // Telegram message size limit

/**
 * Formats the agent reply + matched member cards into a Telegram-friendly plain text message.
 */
export function formatTelegramReply(reply: string, members: Member[]): string {
  const parts: string[] = [reply];

  if (members.length > 0) {
    parts.push('');
    parts.push('── Matched Members ──');

    const STATUS_MAP: Record<string, { icon: string; label: string }> = {
      on_campus: { icon: '✅', label: 'On Campus' },
      remote:    { icon: '🌐', label: 'Remote' },
      off_campus: { icon: '📍', label: 'Off Campus' },
    };

    for (const m of members.slice(0, 3)) {
      const { icon: statusIcon, label: statusLabel } =
        STATUS_MAP[m.status] ?? { icon: '📍', label: 'Off Campus' };

      const lines: string[] = [
        `👤 ${m.name}`,
        `   ${m.specialty} · ${statusIcon} ${statusLabel}`,
      ];

      if (m.building) lines.push(`   Building: ${m.building}`);

      const contacts: string[] = [];
      if (m.email_visible && m.email) contacts.push(`✉ ${m.email}`);
      if (m.social_links?.twitter) contacts.push(`𝕏 @${m.social_links.twitter}`);
      if (m.social_links?.linkedin) contacts.push(`in/${m.social_links.linkedin}`);
      if (m.social_links?.github) contacts.push(`gh/${m.social_links.github}`);
      if (m.social_links?.discord) contacts.push(`dc: ${m.social_links.discord}`);
      if (m.social_links?.website) contacts.push(m.social_links.website);
      if (contacts.length > 0) lines.push(`   ${contacts.join(' · ')}`);

      parts.push(lines.join('\n'));
    }
  }

  parts.push('');
  parts.push('─ NS Member Directory (unofficial)');

  const full = parts.join('\n');
  return full.length > MAX_LENGTH ? full.slice(0, MAX_LENGTH - 3) + '...' : full;
}
