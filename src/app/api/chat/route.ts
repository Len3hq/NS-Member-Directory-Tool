import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, GROQ_MODEL } from '@/agent/runtime';
import { fetchMemberContext } from '@/agent/providers/members';
import type { Member } from '@/types';

const SMALL_TALK = /^(hi+|hello|hey|thanks?|thank you|thx|sup|yo|good morning|good evening|good afternoon|how are you|what'?s up|wassup|ok+|okay|cool|great|awesome|nice|cheers|bye|goodbye|hiya|howdy)[\s!?.]*$/i;

const SYSTEM_SMALL_TALK = `You are a friendly assistant for the NS Member Directory.
When someone greets you or makes small talk, respond warmly in ONE short sentence and ask what kind of person they're looking to connect with. Never mention specific members.`;

const SYSTEM_LOOKUP = `You are a warm, helpful assistant for the NS Member Directory. You talk like a knowledgeable friend, not a database.

Rules:
- Reply in 1-2 short sentences max — conversational, never robotic.
- First look for an exact or very close specialty match.
- If no exact match, suggest the closest adjacent field naturally (e.g. "Not exactly, but [Name] works in [field] and might be able to point you in the right direction.")
- Only say no one is available if truly no related field exists in the directory.
- Never suggest someone from a completely unrelated field.
- For contact, mention only the single most useful one (prefer email, then Twitter, then website) — never dump all links.
- Sound human. No labels like "email:" or "twitter:" — just say "you can reach them at X" or "find them at X".`;

export async function POST(request: NextRequest) {
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { message } = body;
  if (!message?.trim()) {
    return NextResponse.json({ reply: 'What are you looking for?', members: [] });
  }

  try {
    const isSmallTalk = SMALL_TALK.test(message.trim());
    const groq = getGroqClient();

    if (isSmallTalk) {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 60,
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM_SMALL_TALK },
          { role: 'user', content: message },
        ],
      });
      return NextResponse.json({
        reply: res.choices[0]?.message?.content?.trim() ?? 'Hey! What can I help you find?',
        members: [],
      });
    }

    // Member lookup
    const { text: memberContext, members: allMembers } = await fetchMemberContext();

    const res = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 80,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_LOOKUP },
        {
          role: 'user',
          content: `Directory:\n${memberContext}\n\nRequest: "${message}"`,
        },
      ],
    });

    const reply = res.choices[0]?.message?.content?.trim() ?? 'No results found.';

    const mentionedMembers = allMembers.filter((m: Member) =>
      reply.toLowerCase().includes(m.name.toLowerCase())
    );

    return NextResponse.json({ reply, members: mentionedMembers.slice(0, 3) });
  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json(
      { reply: 'The agent is temporarily unavailable. Please try again shortly.', members: [] },
      { status: 500 }
    );
  }
}
