import { getSupabaseReadonly } from '@/lib/supabase';
import type { Member } from '@/types';

const SELECT_FIELDS =
  'id, name, specialty, building, bio, status, email, email_visible, avatar_url, social_links';

export interface MemberContextResult {
  text: string;
  members: Member[];
}

/**
 * Fetches all members from Supabase and formats them as a context string
 * for the LLM. On-campus members are ordered first.
 */
export async function fetchMemberContext(): Promise<MemberContextResult> {
  const db = getSupabaseReadonly();

  const { data, error } = await db
    .from('members')
    .select(SELECT_FIELDS)
    .order('status', { ascending: true }) // on_campus < off_campus alphabetically
    .limit(80);

  if (error || !data || data.length === 0) {
    return { text: 'The member directory is currently empty or unavailable.', members: [] };
  }

  // Sort so on_campus members appear first
  const sorted = [...data].sort((a, b) => {
    if (a.status === 'on_campus' && b.status !== 'on_campus') return -1;
    if (a.status !== 'on_campus' && b.status === 'on_campus') return 1;
    return 0;
  });

  const members = sorted.map((m) => ({
    ...m,
    email: m.email_visible ? m.email : null,
  })) as Member[];

  const memberList = members
    .map((m, i) => {
      const contacts: string[] = [];
      if (m.email_visible && m.email) contacts.push(`email:${m.email}`);
      if (m.social_links?.twitter) contacts.push(`twitter:@${m.social_links.twitter}`);
      if (m.social_links?.linkedin) contacts.push(`linkedin:${m.social_links.linkedin}`);
      if (m.social_links?.github) contacts.push(`github:${m.social_links.github}`);
      if (m.social_links?.website) contacts.push(`web:${m.social_links.website}`);

      return [
        `[${i + 1}]`,
        `name="${m.name}"`,
        `specialty="${m.specialty}"`,
        `status="${m.status === 'on_campus' ? 'On Campus' : 'Off Campus'}"`,
        `building="${m.building || ''}"`,
        `bio="${m.bio || ''}"`,
        `contact="${contacts.join(' | ')}"`,
      ].join(' ');
    })
    .join('\n');

  const text = `NETWORK SCHOOL MEMBER DIRECTORY — ${members.length} members:\n${memberList}`;

  return { text, members };
}
