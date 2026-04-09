import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, GROQ_MODEL } from '@/agent/runtime';
import { fetchMemberContext } from '@/agent/providers/members';
import { formatTelegramReply } from '@/telegram/formatter';
import type { Member } from '@/types';

// Simple in-memory rate limiter: max 5 messages per user per minute
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();

function isRateLimited(userId: number): boolean {
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

async function sendMessage(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[telegram/sendMessage]', err);
  }
}

const SMALL_TALK =
  /^(\/start|hi+|hello|hey|thanks?|thank you|thx|sup|yo|good morning|good evening|good afternoon|how are you|what'?s up|wassup|ok+|okay|cool|great|awesome|nice|cheers|bye|goodbye|hiya|howdy)[\s!?.]*$/i;

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
  // Verify secret token if configured
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const incoming = request.headers.get('x-telegram-bot-api-secret-token');
    if (incoming !== secretToken) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  let update: {
    update_id: number;
    message?: {
      message_id: number;
      from?: { id: number; first_name?: string; username?: string };
      chat: { id: number };
      text?: string;
    };
  };

  try {
    update = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const msg = update.message;

  // Ignore non-text updates (photos, stickers, etc.)
  if (!msg?.text || !msg.from) {
    return new NextResponse('OK', { status: 200 });
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text.trim();

  // Always return 200 to Telegram — non-200 triggers retries
  if (isRateLimited(userId)) {
    await sendMessage(chatId, 'You\'re sending messages too quickly. Please wait a moment and try again.');
    return new NextResponse('OK', { status: 200 });
  }

  try {
    const isSmallTalk = SMALL_TALK.test(text);
    const groq = getGroqClient();

    if (isSmallTalk) {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: 60,
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM_SMALL_TALK },
          { role: 'user', content: text },
        ],
      });
      const reply =
        res.choices[0]?.message?.content?.trim() ??
        "Hey! I'm the NS Directory agent. What kind of person are you looking to connect with?";
      await sendMessage(chatId, reply);
      return new NextResponse('OK', { status: 200 });
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
          content: `Directory:\n${memberContext}\n\nRequest: "${text}"`,
        },
      ],
    });

    const reply = res.choices[0]?.message?.content?.trim() ?? 'No results found.';

    const mentionedMembers = allMembers.filter((m: Member) =>
      reply.toLowerCase().includes(m.name.toLowerCase())
    );

    const formatted = formatTelegramReply(reply, mentionedMembers.slice(0, 3));
    await sendMessage(chatId, formatted);
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('[/api/telegram/webhook]', err);
    try {
      await sendMessage(chatId, 'The directory agent is temporarily unavailable. Please try again shortly.');
    } catch {
      // ignore secondary failure
    }
    return new NextResponse('OK', { status: 200 });
  }
}
