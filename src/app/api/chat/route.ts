import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseReadonly } from '@/lib/supabase';

interface Member {
  id: string;
  name: string;
  specialty: string;
  building: string;
  bio: string | null;
  status: string;
  email: string | null;
  email_visible: boolean;
  avatar_url: string | null;
  social_links: Record<string, string>;
}

function parseQueryIntent(message: string): {
  status?: string;
  specialty?: string;
  keywords?: string;
} {
  const lower = message.toLowerCase();
  const intent: { status?: string; specialty?: string; keywords?: string } = {};

  if (lower.includes('on campus') || lower.includes('here') || lower.includes('currently at')) {
    intent.status = 'on_campus';
  } else if (lower.includes('off campus') || lower.includes('left')) {
    intent.status = 'off_campus';
  } else if (lower.includes('remote')) {
    intent.status = 'remote';
  }

  const specialtyKeywords: [string[], string][] = [
    [['engineer', 'dev', 'developer', 'coder', 'programmer', 'software'], 'Software Engineer'],
    [['design', 'ux', 'ui', 'designer'], 'Designer (UI/UX)'],
    [['founder', 'entrepreneur', 'startup', 'ceo'], 'Founder / Entrepreneur'],
    [['investor', 'vc', 'venture'], 'Investor / VC'],
    [['writer', 'journalist', 'content'], 'Writer / Journalist'],
    [['researcher', 'academic', 'phd'], 'Researcher / Academic'],
    [['lawyer', 'legal', 'policy', 'attorney'], 'Legal / Policy'],
    [['marketing', 'growth', 'seo'], 'Marketing / Growth'],
    [['blockchain', 'crypto', 'web3', 'defi', 'nft', 'solidity'], 'Crypto / Web3'],
    [['ai', 'ml', 'machine learning', 'llm', 'artificial intelligence'], 'AI / ML Engineer'],
    [['data', 'analytics', 'scientist'], 'Data Scientist'],
    [['product', 'pm', 'product manager'], 'Product Manager'],
    [['hardware', 'robotics', 'embedded'], 'Hardware / Robotics'],
    [['biotech', 'health', 'medical', 'bio'], 'Biotech / Health'],
  ];

  for (const [keywords, specialty] of specialtyKeywords) {
    if (keywords.some((k) => lower.includes(k))) {
      intent.specialty = specialty;
      break;
    }
  }

  intent.keywords = message;
  return intent;
}

const SELECT_FIELDS = 'id, name, specialty, building, bio, status, email, email_visible, avatar_url, social_links';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ reply: 'Please ask me something about NS members.', members: [] });
  }

  const lower = message.toLowerCase();

  // Greetings
  if (['hi', 'hello', 'hey', 'sup', 'yo'].some((g) => lower.trim() === g || lower.startsWith(g + ' '))) {
    return NextResponse.json({
      reply: "Hi! Ask me to find members by specialty, what they're building, or campus status. Try: \"who's on campus?\" or \"find a blockchain developer\".",
      members: [],
    });
  }

  // Count query
  if (lower.includes('how many') || lower.includes('count')) {
    const { count } = await getSupabaseReadonly()
      .from('members')
      .select('*', { count: 'exact', head: true });
    const { count: onCampus } = await getSupabaseReadonly()
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'on_campus');
    return NextResponse.json({
      reply: `${count ?? 0} members total · ${onCampus ?? 0} currently on campus`,
      members: [],
    });
  }

  const intent = parseQueryIntent(message);

  let query = getSupabaseReadonly()
    .from('members')
    .select(SELECT_FIELDS)
    .limit(6);

  if (intent.status) query = query.eq('status', intent.status);

  if (intent.specialty) {
    query = query.eq('specialty', intent.specialty);
  } else if (intent.keywords) {
    query = query.or(
      `name.ilike.%${intent.keywords}%,specialty.ilike.%${intent.keywords}%,building.ilike.%${intent.keywords}%,bio.ilike.%${intent.keywords}%`
    );
  }

  const { data: members, error } = await query;

  if (error) {
    return NextResponse.json({ reply: 'Search failed. Please try again.', members: [] });
  }

  if (!members || members.length === 0) {
    // Retry with broader search
    if (intent.specialty) {
      const { data: fallback } = await getSupabaseReadonly()
        .from('members')
        .select(SELECT_FIELDS)
        .or(`building.ilike.%${message}%,bio.ilike.%${message}%`)
        .limit(6);

      if (fallback && fallback.length > 0) {
        const sanitized = fallback.map((m) => ({ ...m, email: m.email_visible ? m.email : null }));
        return NextResponse.json({
          reply: `No exact match for "${intent.specialty}" — here are some related members:`,
          members: sanitized,
        });
      }
    }

    return NextResponse.json({
      reply: `No members found for "${message}". Try: "blockchain developer", "who's on campus?", or "find a founder".`,
      members: [],
    });
  }

  const sanitized = (members as Member[]).map((m) => ({
    ...m,
    email: m.email_visible ? m.email : null,
  }));

  const statusNote = intent.status === 'on_campus' ? ' on campus' : intent.status === 'remote' ? ' remote' : '';
  const specialtyNote = intent.specialty ? ` · ${intent.specialty}` : '';
  const reply = `Found ${members.length} member${members.length > 1 ? 's' : ''}${specialtyNote}${statusNote}`;

  return NextResponse.json({ reply, members: sanitized });
}
