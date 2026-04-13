/**
 * discord-register.js — registers (or updates) the /ask slash command with Discord.
 *
 * Run once after setting env vars, and again whenever you change the command definition.
 *
 * Usage:
 *   npm run discord:register
 *
 * To register globally (all servers, up to 1 hour to propagate):
 *   DISCORD_GUILD_ID= npm run discord:register
 *
 * To register for a specific guild only (instant, good for dev):
 *   Set DISCORD_GUILD_ID in .env.local to your server ID.
 */

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // optional — leave blank for global

if (!APPLICATION_ID) {
  console.error('\n[ERROR] DISCORD_APPLICATION_ID is not set in .env.local\n');
  process.exit(1);
}
if (!BOT_TOKEN) {
  console.error('\n[ERROR] DISCORD_BOT_TOKEN is not set in .env.local\n');
  process.exit(1);
}

const commands = [
  {
    name: 'ask',
    description: 'Search the NS Member Directory for people to connect with',
    options: [
      {
        name: 'query',
        description: 'What kind of person are you looking for? e.g. "a web3 developer" or "someone building in biotech"',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

const url = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

const scope = GUILD_ID ? `guild ${GUILD_ID}` : 'global';

async function register() {
  console.log(`\nRegistering /ask command (${scope})…`);

  const res = await fetch(url, {
    method: 'PUT', // PUT replaces all commands atomically
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('[ERROR] Discord API error:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`✓ Registered ${data.length} command(s):`);
  for (const cmd of data) {
    console.log(`  /${cmd.name} — ${cmd.description} (id: ${cmd.id})`);
  }

  if (!GUILD_ID) {
    console.log('\n⏳ Global commands can take up to 1 hour to appear in all servers.');
    console.log('   For instant updates during development, set DISCORD_GUILD_ID in .env.local.\n');
  } else {
    console.log('\n✅ Guild command registered instantly.\n');
  }
}

register().catch((err) => {
  console.error(err);
  process.exit(1);
});
