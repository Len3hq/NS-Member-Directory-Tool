import { NextResponse } from 'next/server';

/**
 * GET /api/telegram/setup
 * Call this once after deploying to register your webhook with Telegram.
 * Example: https://your-domain.com/api/telegram/setup
 */
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 });
  }
  if (!appUrl) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const body: Record<string, string> = { url: webhookUrl };
  if (secret) body.secret_token = secret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.ok) {
    return NextResponse.json({ error: data.description ?? 'Failed to set webhook' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    webhook: webhookUrl,
    telegram: data,
  });
}
