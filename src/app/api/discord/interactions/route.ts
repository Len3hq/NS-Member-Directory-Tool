import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, GROQ_MODEL } from '@/agent/runtime';
import { fetchMemberContext } from '@/agent/providers/members';
import { formatDiscordReply } from '@/discord/formatter';
import type { Member } from '@/types';

// ---------------------------------------------------------------------------
// Discord interaction types
// ---------------------------------------------------------------------------
const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;

const INTERACTION_RESPONSE_TYPE_PONG = 1;
const INTERACTION_RESPONSE_TYPE_DEFERRED = 5; // thinking… shown to user while we work

// ---------------------------------------------------------------------------
// Signature verification (Ed25519 via Web Crypto API)
// ---------------------------------------------------------------------------
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  publicKey: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + rawBody);
    const sigBytes = hexToBytes(signature);
    const keyBytes = hexToBytes(publicKey);

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );

    return await crypto.subtle.verify('Ed25519', key, sigBytes, message);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (per Discord user ID)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

// ---------------------------------------------------------------------------
// LLM prompts (same as Telegram bot)
// ---------------------------------------------------------------------------
const SMALL_TALK =
  /^(hi+|hello|hey|thanks?|thank you|thx|sup|yo|good morning|good evening|good afternoon|how are you|what'?s up|wassup|ok+|okay|cool|great|awesome|nice|cheers|bye|goodbye|hiya|howdy)[\s!?.]*$/i;

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

// ---------------------------------------------------------------------------
// Discord follow-up (edits the deferred "thinking…" message)
// ---------------------------------------------------------------------------
async function sendFollowup(
  applicationId: string,
  interactionToken: string,
  body: object,
): Promise<void> {
  const url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[discord/followup]', res.status, err);
  }
}

// ---------------------------------------------------------------------------
// Background handler — runs after we've returned the deferred 200 to Discord
// ---------------------------------------------------------------------------
async function handleLookup(
  userId: string,
  query: string,
  applicationId: string,
  interactionToken: string,
): Promise<void> {
  if (isRateLimited(userId)) {
    await sendFollowup(applicationId, interactionToken, {
      content: "You're asking too quickly — please wait a moment and try again.",
    });
    return;
  }

  try {
    const isSmallTalk = SMALL_TALK.test(query.trim());
    const groq = getGroqClient();

    if (isSmallTalk) {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 60,
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM_SMALL_TALK },
          { role: 'user', content: query },
        ],
      });
      const reply =
        res.choices[0]?.message?.content?.trim() ??
        "Hey! I'm the NS Directory agent. What kind of person are you looking to connect with?";

      await sendFollowup(applicationId, interactionToken, { content: reply });
      return;
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
          content: `Directory:\n${memberContext}\n\nRequest: "${query}"`,
        },
      ],
    });

    const reply = res.choices[0]?.message?.content?.trim() ?? 'No results found.';

    const mentionedMembers = allMembers.filter((m: Member) =>
      reply.toLowerCase().includes(m.name.toLowerCase()),
    );

    const message = formatDiscordReply(reply, mentionedMembers.slice(0, 3));
    await sendFollowup(applicationId, interactionToken, message);
  } catch (err) {
    console.error('[discord/handleLookup]', err);
    await sendFollowup(applicationId, interactionToken, {
      content: 'The directory agent is temporarily unavailable. Please try again shortly.',
    });
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse> {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!publicKey || !applicationId) {
    console.error('[discord/interactions] Missing DISCORD_PUBLIC_KEY or DISCORD_APPLICATION_ID');
    return new NextResponse('Server misconfigured', { status: 500 });
  }

  // Verify Discord signature
  const signature = request.headers.get('x-signature-ed25519') ?? '';
  const timestamp = request.headers.get('x-signature-timestamp') ?? '';
  const rawBody = await request.text();

  const valid = await verifySignature(rawBody, signature, timestamp, publicKey);
  if (!valid) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let interaction: {
    type: number;
    id: string;
    token: string;
    member?: { user?: { id: string } };
    user?: { id: string };
    data?: { name: string; options?: { name: string; value: string }[] };
  };

  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // PING — Discord uses this to verify the endpoint is live
  if (interaction.type === INTERACTION_TYPE_PING) {
    return NextResponse.json({ type: INTERACTION_RESPONSE_TYPE_PONG });
  }

  // Slash command
  if (interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND) {
    const query =
      interaction.data?.options?.find((o) => o.name === 'query')?.value ?? '';
    const userId =
      interaction.member?.user?.id ?? interaction.user?.id ?? 'unknown';

    // Start background work (fire and forget — Node.js keeps the event loop alive)
    handleLookup(userId, query, applicationId, interaction.token).catch((err) =>
      console.error('[discord/interactions] unhandled background error', err),
    );

    // Return deferred response immediately so Discord doesn't time out (3s limit)
    return NextResponse.json({ type: INTERACTION_RESPONSE_TYPE_DEFERRED });
  }

  return NextResponse.json({ type: INTERACTION_RESPONSE_TYPE_PONG });
}
