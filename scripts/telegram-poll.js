/**
 * Local Telegram polling script for development.
 *
 * Instead of requiring a public webhook URL, this script polls the Telegram
 * Bot API for new messages and forwards each update to your local Next.js
 * server — letting you test the bot without ngrok or any tunnel.
 *
 * Usage:
 *   npm run telegram:poll
 *
 * Requirements:
 *   - Next.js dev server must be running (npm run dev) in a separate terminal
 *   - TELEGRAM_BOT_TOKEN must be set in .env.local
 */

const POLL_TIMEOUT = 30; // seconds Telegram holds the connection open
const LOCAL_WEBHOOK = 'http://localhost:3000/api/telegram/webhook';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('\n[ERROR] TELEGRAM_BOT_TOKEN is not set.');
    console.error('Add it to .env.local, then run: npm run telegram:poll\n');
    process.exit(1);
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';

  // Delete any registered webhook so getUpdates works
  const del = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  const delData = await del.json();
  if (!delData.ok) {
    console.error('[ERROR] Could not clear webhook:', delData.description);
    process.exit(1);
  }

  // Get bot info for a friendlier log message
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = await meRes.json();
  const botName = me.ok ? `@${me.result.username}` : 'your bot';

  console.log(`\n✅ Polling started for ${botName}`);
  console.log(`   Forwarding updates → ${LOCAL_WEBHOOK}`);
  console.log('   Send a message to your bot on Telegram to test it.');
  console.log('   Press Ctrl+C to stop.\n');

  let offset = 0;

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?timeout=${POLL_TIMEOUT}&offset=${offset}`,
        { signal: AbortSignal.timeout((POLL_TIMEOUT + 10) * 1000) }
      );
      const data = await res.json();

      if (!data.ok) {
        console.error('[Telegram] getUpdates failed:', data.description);
        await sleep(5000);
        continue;
      }

      for (const update of data.result) {
        offset = update.update_id + 1;

        const msg = update.message;
        const from = msg?.from?.first_name ?? 'unknown';
        const text = msg?.text ?? '(non-text)';
        console.log(`→ [${from}]: ${text}`);

        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['x-telegram-bot-api-secret-token'] = secret;

        try {
          const webhookRes = await fetch(LOCAL_WEBHOOK, {
            method: 'POST',
            headers,
            body: JSON.stringify(update),
          });

          if (!webhookRes.ok) {
            const body = await webhookRes.text();
            console.error(`  [webhook error] ${webhookRes.status}: ${body}`);
          } else {
            console.log(`  ✓ handled`);
          }
        } catch (err) {
          console.error(`  [local server unreachable] ${err.message}`);
          console.error('  Make sure "npm run dev" is running in another terminal.');
        }
      }
    } catch (err) {
      if (err.name === 'TimeoutError') {
        // Normal long-poll timeout, just loop again
        continue;
      }
      console.error('[poll error]', err.message);
      await sleep(5000);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
