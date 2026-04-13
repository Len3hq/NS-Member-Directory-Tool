/**
 * Discord Gateway bot — reads channel messages and responds intelligently.
 *
 * The bot responds when:
 *   1. It is @mentioned anywhere
 *   2. A message is sent in DISCORD_CHANNEL_ID (if set) — a dedicated directory channel
 *
 * Usage:
 *   npm run discord:bot
 *
 * Required env vars:
 *   DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, GROQ_API_KEY,
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Optional:
 *   DISCORD_CHANNEL_ID — if set, bot responds to every (non-bot) message in this channel
 *
 * Privileged intent required:
 *   Discord Developer Portal → Bot → Message Content Intent → ON
 */

// ─── env ──────────────────────────────────────────────────────────────────────
const BOT_TOKEN     = process.env.DISCORD_BOT_TOKEN;
const GROQ_API_KEY  = process.env.GROQ_API_KEY;
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WATCH_CHANNEL = process.env.DISCORD_CHANNEL_ID ?? null; // optional

for (const [k, v] of Object.entries({ DISCORD_BOT_TOKEN: BOT_TOKEN, GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_KEY })) {
  if (!v) { console.error(`[ERROR] Missing env var: ${k}`); process.exit(1); }
}

// ─── Discord constants ─────────────────────────────────────────────────────────
const GATEWAY_VERSION = 10;
const INTENTS =
  (1 << 0)  | // GUILDS
  (1 << 9)  | // GUILD_MESSAGES
  (1 << 15);  // MESSAGE_CONTENT (privileged — must be enabled in dev portal)

const OP = { DISPATCH: 0, HEARTBEAT: 1, IDENTIFY: 2, RECONNECT: 7, INVALID_SESSION: 9, HELLO: 10, HEARTBEAT_ACK: 11 };

// ─── LLM prompts ──────────────────────────────────────────────────────────────
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SMALL_TALK = /^(hi+|hello|hey|thanks?|thank you|thx|sup|yo|good morning|good evening|good afternoon|how are you|what'?s up|wassup|ok+|okay|cool|great|awesome|nice|cheers|bye|goodbye|hiya|howdy)[\s!?.]*$/i;

const SYSTEM_SMALL_TALK = `You are a friendly assistant for the NS Member Directory.
When someone greets you or makes small talk, respond warmly in ONE short sentence and ask what kind of person they're looking to connect with. Never mention specific members.`;

const SYSTEM_LOOKUP = `You are a warm, helpful assistant for the NS Member Directory. You talk like a knowledgeable friend, not a database.

Rules:
- Reply in 1-2 short sentences max — conversational, never robotic.
- First look for an exact or very close specialty match.
- If no exact match, suggest the closest adjacent field naturally.
- Only say no one is available if truly no related field exists in the directory.
- Never suggest someone from a completely unrelated field.
- For contact, mention only the single most useful one (prefer email, then Twitter, then website).
- Sound human. No labels like "email:" or "twitter:" — just say "you can reach them at X".`;

// ─── Rate limiter ──────────────────────────────────────────────────────────────
const rateLimit = new Map(); // userId → { count, resetAt }

function isRateLimited(userId) {
  const now = Date.now();
  const entry = rateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

// ─── Supabase — fetch member directory ────────────────────────────────────────
async function fetchMemberContext() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/members?select=name,specialty,building,bio,status,email,email_visible,social_links&order=status.asc&limit=80`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) return { text: 'The member directory is currently unavailable.', members: [] };

  const raw = await res.json();
  if (!raw.length) return { text: 'The member directory is currently empty.', members: [] };

  // on_campus first
  const sorted = raw.sort((a, b) =>
    a.status === 'on_campus' && b.status !== 'on_campus' ? -1 :
    a.status !== 'on_campus' && b.status === 'on_campus' ? 1 : 0
  );

  const members = sorted.map(m => ({ ...m, email: m.email_visible ? m.email : null }));

  const memberList = members.map((m, i) => {
    const contacts = [];
    if (m.email_visible && m.email) contacts.push(`email:${m.email}`);
    if (m.social_links?.twitter) contacts.push(`twitter:${m.social_links.twitter}`);
    if (m.social_links?.linkedin) contacts.push(`linkedin:${m.social_links.linkedin}`);
    if (m.social_links?.github) contacts.push(`github:${m.social_links.github}`);
    if (m.social_links?.website) contacts.push(`web:${m.social_links.website}`);
    return `[${i + 1}] name="${m.name}" specialty="${m.specialty}" status="${m.status === 'on_campus' ? 'On Campus' : 'Off Campus'}" building="${m.building || ''}" bio="${m.bio || ''}" contact="${contacts.join(' | ')}"`;
  }).join('\n');

  return {
    text: `NETWORK SCHOOL MEMBER DIRECTORY — ${members.length} members:\n${memberList}`,
    members,
  };
}

// ─── Groq ─────────────────────────────────────────────────────────────────────
async function groqChat(messages, maxTokens = 80, temperature = 0.2) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Discord REST ──────────────────────────────────────────────────────────────
async function sendMessage(channelId, content) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bot ${BOT_TOKEN}` },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) console.error('[discord/send]', res.status, await res.text());
}

// ─── Message handler ───────────────────────────────────────────────────────────
async function handleMessage(msg, botUserId) {
  // Skip bots (including ourselves)
  if (msg.author?.bot) return;

  const isMentioned = (msg.mentions ?? []).some(u => u.id === botUserId);
  const isWatchedChannel = WATCH_CHANNEL && msg.channel_id === WATCH_CHANNEL;

  if (!isMentioned && !isWatchedChannel) return;

  // Strip the @mention from the text so the LLM sees a clean query
  const query = msg.content
    .replace(/<@!?\d+>/g, '')
    .trim();

  if (!query) {
    await sendMessage(msg.channel_id, "Hey! Ask me to find someone — e.g. *\"who's building in AI?\"* or *\"find me a designer on campus\"*.");
    return;
  }

  if (isRateLimited(msg.author.id)) {
    await sendMessage(msg.channel_id, "You're asking too quickly — give it a minute.");
    return;
  }

  console.log(`→ [${msg.author.username}] ${query}`);

  try {
    if (SMALL_TALK.test(query)) {
      const reply = await groqChat(
        [{ role: 'system', content: SYSTEM_SMALL_TALK }, { role: 'user', content: query }],
        60, 0.5
      );
      await sendMessage(msg.channel_id, reply);
      return;
    }

    const { text: memberContext, members } = await fetchMemberContext();
    const reply = await groqChat([
      { role: 'system', content: SYSTEM_LOOKUP },
      { role: 'user', content: `Directory:\n${memberContext}\n\nRequest: "${query}"` },
    ]);

    // Append member cards for anyone named in the reply
    const matched = members.filter(m => reply.toLowerCase().includes(m.name.toLowerCase()));
    const cards = matched.slice(0, 3).map(m => {
      const STATUS = m.status === 'on_campus' ? '✅ On Campus' : '📍 Off Campus';
      const lines = [`**${m.name}** — ${m.specialty} · ${STATUS}`];
      if (m.building) lines.push(`> Building: ${m.building}`);
      const contacts = [];
      if (m.email_visible && m.email) contacts.push(m.email);
      if (m.social_links?.twitter) contacts.push(m.social_links.twitter);
      if (m.social_links?.website) contacts.push(m.social_links.website);
      if (contacts.length) lines.push(`> ${contacts.join(' · ')}`);
      return lines.join('\n');
    });

    const full = [reply, ...cards].join('\n\n');
    await sendMessage(msg.channel_id, full);
    console.log(`  ✓ replied`);
  } catch (err) {
    console.error('[handleMessage]', err.message);
    await sendMessage(msg.channel_id, 'The directory agent ran into an issue — please try again shortly.');
  }
}

// ─── Gateway connection ────────────────────────────────────────────────────────
let ws = null;
let heartbeatTimer = null;
let heartbeatAcked = true;
let sessionId = null;
let resumeGatewayUrl = null;
let lastSeq = null;
let botUserId = null;
let reconnectDelay = 1000;

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startHeartbeat(interval) {
  stopHeartbeat();
  heartbeatAcked = true;
  heartbeatTimer = setInterval(() => {
    if (!heartbeatAcked) {
      console.warn('[gateway] No heartbeat ACK — reconnecting…');
      ws?.terminate?.();
      ws?.close?.();
      return;
    }
    heartbeatAcked = false;
    ws?.send(JSON.stringify({ op: OP.HEARTBEAT, d: lastSeq }));
  }, interval);
}

function identify() {
  ws.send(JSON.stringify({
    op: OP.IDENTIFY,
    d: {
      token: BOT_TOKEN,
      intents: INTENTS,
      properties: { os: 'linux', browser: 'ns-directory', device: 'ns-directory' },
    },
  }));
}

function resume() {
  ws.send(JSON.stringify({
    op: 6, // RESUME
    d: { token: BOT_TOKEN, session_id: sessionId, seq: lastSeq },
  }));
}

async function connect(forceNew = false) {
  const gatewayBase = (!forceNew && resumeGatewayUrl) ? resumeGatewayUrl : 'wss://gateway.discord.gg';
  const url = `${gatewayBase}/?v=${GATEWAY_VERSION}&encoding=json`;
  console.log(`[gateway] Connecting to ${url}…`);

  ws = new WebSocket(url);

  ws.addEventListener('message', ({ data }) => {
    let payload;
    try { payload = JSON.parse(data); } catch { return; }

    const { op, d, t, s } = payload;
    if (s != null) lastSeq = s;

    if (op === OP.HELLO) {
      startHeartbeat(d.heartbeat_interval);
      if (sessionId && !forceNew) {
        console.log('[gateway] Resuming session…');
        resume();
      } else {
        identify();
      }
      return;
    }

    if (op === OP.HEARTBEAT_ACK) { heartbeatAcked = true; return; }
    if (op === OP.HEARTBEAT)     { ws.send(JSON.stringify({ op: OP.HEARTBEAT, d: lastSeq })); return; }

    if (op === OP.RECONNECT) {
      console.log('[gateway] Reconnect requested');
      ws.close(4000);
      return;
    }

    if (op === OP.INVALID_SESSION) {
      console.log('[gateway] Invalid session — re-identifying');
      sessionId = null;
      setTimeout(() => connect(true), 2000);
      return;
    }

    if (op === OP.DISPATCH) {
      if (t === 'READY') {
        botUserId = d.user.id;
        sessionId = d.session_id;
        resumeGatewayUrl = d.resume_gateway_url;
        reconnectDelay = 1000;
        console.log(`✅ Logged in as ${d.user.username}#${d.user.discriminator} (${botUserId})`);
        if (WATCH_CHANNEL) console.log(`   Watching channel: ${WATCH_CHANNEL}`);
        console.log('   Respond trigger: @mention' + (WATCH_CHANNEL ? ' or watched channel' : ''));
        return;
      }

      if (t === 'RESUMED') {
        reconnectDelay = 1000;
        console.log('[gateway] Session resumed');
        return;
      }

      if (t === 'MESSAGE_CREATE') {
        handleMessage(d, botUserId).catch(err => console.error('[MESSAGE_CREATE]', err));
        return;
      }
    }
  });

  ws.addEventListener('close', ({ code, reason }) => {
    stopHeartbeat();
    const nonResumable = [4004, 4010, 4011, 4012, 4013, 4014];
    console.log(`[gateway] Closed (${code}): ${reason || 'no reason'}`);
    if (nonResumable.includes(code)) {
      console.error('[gateway] Fatal close code — check bot token and intents. Exiting.');
      process.exit(1);
    }
    const delay = Math.min(reconnectDelay, 30_000);
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
    console.log(`[gateway] Reconnecting in ${delay}ms…`);
    setTimeout(() => connect(), delay);
  });

  ws.addEventListener('error', (err) => {
    console.error('[gateway] WebSocket error:', err.message ?? err);
  });
}

// ─── Start ─────────────────────────────────────────────────────────────────────
console.log('\nNS Member Directory — Discord bot starting…');
if (WATCH_CHANNEL) console.log(`Dedicated channel mode: #${WATCH_CHANNEL}`);
else console.log('Mention mode: @mention the bot to query the directory');
console.log('');

connect(true);
