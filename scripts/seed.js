// scripts/seed.js — populate the members table with mock data
// Run with: node --env-file=.env.local scripts/seed.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const members = [
  {
    name: 'Aisha Nwosu',
    email: 'aisha.nwosu@example.com',
    email_visible: true,
    specialty: 'AI / ML Engineer',
    building: 'An open-source fine-tuning toolkit for small language models',
    bio: 'ML researcher turned builder. Previously at DeepMind working on multi-agent systems. Now obsessed with making AI training accessible to indie developers.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=aisha',
    social_links: {
      twitter: 'https://twitter.com/aishanwosu',
      github: 'https://github.com/aishanwosu',
      linkedin: 'https://linkedin.com/in/aishanwosu',
    },
  },
  {
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@example.com',
    email_visible: false,
    specialty: 'Founder / Entrepreneur',
    building: 'A B2B SaaS platform for logistics automation in Latin America',
    bio: 'Serial founder, third company. First two were acquired. Focused on emerging markets where old logistics software just breaks. Mexican-American, based in CDMX.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=carlos',
    social_links: {
      twitter: 'https://twitter.com/carlmendoza',
      linkedin: 'https://linkedin.com/in/carlosmendozamx',
      website: 'https://carlmendoza.com',
    },
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    email_visible: true,
    specialty: 'Investor / VC',
    building: 'A thesis around AI-native infrastructure for the Global South',
    bio: 'Partner at a seed-stage fund. Former operator at Stripe and Razorpay. I write checks for founders who are 12 months ahead of the narrative.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=priya',
    social_links: {
      twitter: 'https://twitter.com/priyasharmavc',
      linkedin: 'https://linkedin.com/in/priyasharmainvests',
    },
  },
  {
    name: 'Tobias Krentz',
    email: 'tobias.krentz@example.com',
    email_visible: false,
    specialty: 'Software Engineer',
    building: 'A developer tool for schema-first API design with live mocking',
    bio: 'Backend engineer with a fondness for compilers and distributed systems. Spent 6 years at Cloudflare, now going independent. Based in Berlin.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=tobias',
    social_links: {
      github: 'https://github.com/tkrentz',
      twitter: 'https://twitter.com/tobiaskrentz',
    },
  },
  {
    name: 'Mei Lin',
    email: 'meilin@example.com',
    email_visible: true,
    specialty: 'Designer (UI/UX)',
    building: 'A design system for AI-generated interfaces that feel human',
    bio: 'Product designer who obsesses over motion and micro-interactions. Led design at two YC companies. Currently exploring the edge where LLM outputs meet design systems.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=meilin',
    social_links: {
      twitter: 'https://twitter.com/meilindesigns',
      website: 'https://meilin.design',
      linkedin: 'https://linkedin.com/in/meilindesigner',
    },
  },
  {
    name: 'Kwame Asante',
    email: 'kwame.asante@example.com',
    email_visible: false,
    specialty: 'Crypto / Web3',
    building: 'A cross-chain liquidity protocol targeting African DeFi users',
    bio: 'DeFi protocol architect with deep experience in EVM and Cosmos ecosystems. Previously Uniswap Labs. Ghanaian, building for the continent.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=kwame',
    social_links: {
      twitter: 'https://twitter.com/kwameasante',
      github: 'https://github.com/kwameasante',
      discord: 'kwame.eth#4421',
    },
  },
  {
    name: 'Fatima Al-Rashid',
    email: 'fatima.alrashid@example.com',
    email_visible: true,
    specialty: 'Writer / Journalist',
    building: 'A newsletter on AI policy in the Middle East and North Africa',
    bio: 'Tech journalist turned policy researcher. Former bureau at MIT Technology Review. Now writing independently about how governments in MENA are approaching AI governance.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=fatima',
    social_links: {
      twitter: 'https://twitter.com/fatima_writes',
      website: 'https://fatimawrites.substack.com',
    },
  },
  {
    name: 'Luca Ferretti',
    email: 'luca.ferretti@example.com',
    email_visible: true,
    specialty: 'Product Manager',
    building: 'Better tooling for async product rituals in remote-first teams',
    bio: 'PM with 8 years in consumer and developer tools. Shipped products at Notion and Linear. Interested in how rituals and async tooling shape team culture.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=luca',
    social_links: {
      twitter: 'https://twitter.com/lucaferretti',
      linkedin: 'https://linkedin.com/in/lucaferretti',
    },
  },
  {
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    email_visible: false,
    specialty: 'Researcher / Academic',
    building: 'Research on emergent capabilities in sparse mixture-of-experts models',
    bio: 'PhD student at Stanford AI Lab (on leave). Studying scaling laws and emergent behavior. Co-authored three NeurIPS papers. Side project: teaching LLMs to write proofs.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=yuki',
    social_links: {
      github: 'https://github.com/yukitanaka-ml',
      twitter: 'https://twitter.com/yukitanakaml',
      website: 'https://yukitanaka.xyz',
    },
  },
  {
    name: 'Amara Diallo',
    email: 'amara.diallo@example.com',
    email_visible: true,
    specialty: 'Operations / Finance',
    building: 'Systematizing back-office ops for early-stage African startups',
    bio: 'CFO-for-hire across fintech and agritech startups. Former investment banker at Goldman Sachs Lagos. Making financial operations less painful for founders who should be building.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=amara',
    social_links: {
      linkedin: 'https://linkedin.com/in/amaradiallo',
      twitter: 'https://twitter.com/amaradiallo_ops',
    },
  },
  {
    name: 'Soren Bjornsson',
    email: 'soren.bjornsson@example.com',
    email_visible: false,
    specialty: 'Hardware / Robotics',
    building: 'Autonomous farm robots for smallholder agriculture in Scandinavia',
    bio: 'Robotics engineer and former military drone systems developer. Pivoting from defense to climate-positive agriculture. Building open-hardware platforms.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=soren',
    social_links: {
      github: 'https://github.com/sorenbjornsson',
      linkedin: 'https://linkedin.com/in/sorenbjornsson',
    },
  },
  {
    name: 'Nina Vasquez',
    email: 'nina.vasquez@example.com',
    email_visible: true,
    specialty: 'Marketing / Growth',
    building: 'A growth playbook for developer-led B2B products',
    bio: 'Growth lead who spent 4 years running PLG experiments at Vercel. Now consulting for devtools startups and writing a book on community-driven acquisition.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=nina',
    social_links: {
      twitter: 'https://twitter.com/ninavasquezgrowth',
      website: 'https://ninavasquez.com',
      linkedin: 'https://linkedin.com/in/ninavasquez',
    },
  },
  {
    name: 'Rahul Kapoor',
    email: 'rahul.kapoor@example.com',
    email_visible: false,
    specialty: 'Data Scientist',
    building: 'An ML pipeline for fraud detection in real-time payment systems',
    bio: 'Data scientist turned ML engineer. Built fraud models serving 40M transactions/day at PhonePe. Now applying those learnings in a startup context.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=rahul',
    social_links: {
      github: 'https://github.com/rahulkapoorml',
      linkedin: 'https://linkedin.com/in/rahulkapoordata',
    },
  },
  {
    name: 'Ingrid Hoffmann',
    email: 'ingrid.hoffmann@example.com',
    email_visible: true,
    specialty: 'Legal / Policy',
    building: 'A legal framework for AI liability in the EU regulatory environment',
    bio: 'Lawyer specializing in technology regulation. Worked on the EU AI Act consultations. Now advising startups on compliance-by-design and building educational resources on AI law.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=ingrid',
    social_links: {
      twitter: 'https://twitter.com/ingridhoffmannlaw',
      linkedin: 'https://linkedin.com/in/ingridhoffmann',
      website: 'https://ailaw.ingridhoffmann.com',
    },
  },
  {
    name: 'Elias Okoye',
    email: 'elias.okoye@example.com',
    email_visible: false,
    specialty: 'Biotech / Health',
    building: 'A diagnostics platform for early-stage sepsis detection in low-resource hospitals',
    bio: 'Medical doctor and engineer. Trained at Johns Hopkins, now building technology to save lives where ICU infrastructure is scarce. Passionate about global health equity.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=elias',
    social_links: {
      linkedin: 'https://linkedin.com/in/eliasokoye',
      twitter: 'https://twitter.com/eliasokoye_md',
    },
  },
  {
    name: 'Sophie Chen',
    email: 'sophie.chen@example.com',
    email_visible: true,
    specialty: 'Software Engineer',
    building: 'A type-safe ORM for TypeScript with zero-cost abstractions',
    bio: 'TypeScript enthusiast and open-source maintainer. Core contributor to tRPC. Love reading type-level programming papers and turning them into useful libraries.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=sophie',
    social_links: {
      github: 'https://github.com/sophiechen',
      twitter: 'https://twitter.com/sophiechen_ts',
      website: 'https://sophiechen.dev',
    },
  },
  {
    name: 'Marcus Webb',
    email: 'marcus.webb@example.com',
    email_visible: false,
    specialty: 'Founder / Entrepreneur',
    building: 'Consumer AI for personal finance management targeted at Gen Z',
    bio: 'First-time founder, ex-Robinhood. Saw the gap between financial literacy tools that exist and what Gen Z actually wants. Building conversationally-first money experiences.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=marcus',
    social_links: {
      twitter: 'https://twitter.com/marcuswebb',
      linkedin: 'https://linkedin.com/in/marcuswebb',
    },
  },
  {
    name: 'Zara Ahmed',
    email: 'zara.ahmed@example.com',
    email_visible: true,
    specialty: 'Designer (UI/UX)',
    building: 'Designing intuitive interfaces for AI-assisted code review tools',
    bio: 'Design systems lead with roots in accessibility. Previously Meta. Thinking a lot about how to make AI coding tools feel less like black boxes and more like collaborators.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=zara',
    social_links: {
      website: 'https://zaraahmed.design',
      twitter: 'https://twitter.com/zaraahmeddesign',
      linkedin: 'https://linkedin.com/in/zaraahmed',
    },
  },
  {
    name: 'Jakub Novak',
    email: 'jakub.novak@example.com',
    email_visible: false,
    specialty: 'Crypto / Web3',
    building: 'ZK-proof infrastructure for private on-chain voting systems',
    bio: 'Cryptographer and smart contract developer. Deep expertise in zero-knowledge proofs and their governance applications. Previously Polygon zkEVM team.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=jakub',
    social_links: {
      github: 'https://github.com/jakubnovak-zk',
      twitter: 'https://twitter.com/jakubnovakzk',
      discord: 'jakub.zk#7712',
    },
  },
  {
    name: 'Chloe Osei',
    email: 'chloe.osei@example.com',
    email_visible: true,
    specialty: 'AI / ML Engineer',
    building: 'Evaluation frameworks for long-context retrieval-augmented generation',
    bio: 'AI engineer focused on production reliability of LLM systems. Former Cohere. Obsessed with the gap between benchmark performance and real-world deployment quality.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=chloe',
    social_links: {
      github: 'https://github.com/chloeosei',
      twitter: 'https://twitter.com/chloeosei_ai',
      website: 'https://chloeosei.dev',
    },
  },
  {
    name: 'Diego Herrera',
    email: 'diego.herrera@example.com',
    email_visible: false,
    specialty: 'Marketing / Growth',
    building: 'A growth studio for early-stage Web3 projects in Spanish-speaking markets',
    bio: 'Community builder and growth strategist. Grew two crypto communities to 100K+ members. Bridging the gap between English-first crypto culture and Latin American users.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=diego',
    social_links: {
      twitter: 'https://twitter.com/diegoherrera_mx',
      linkedin: 'https://linkedin.com/in/diegoherrera',
    },
  },
  {
    name: 'Hana Kimura',
    email: 'hana.kimura@example.com',
    email_visible: true,
    specialty: 'Researcher / Academic',
    building: 'Longitudinal study on AI adoption patterns in Japanese enterprise culture',
    bio: 'Sociologist studying the human side of AI adoption. Fieldwork in Tokyo corporations shows a very different picture than Silicon Valley narratives suggest.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=hana',
    social_links: {
      twitter: 'https://twitter.com/hanakimura_research',
      website: 'https://hana.kimura.ac.jp',
    },
  },
  {
    name: 'James Achebe',
    email: 'james.achebe@example.com',
    email_visible: true,
    specialty: 'Investor / VC',
    building: 'A scout network connecting African diaspora angels with Lagos and Nairobi startups',
    bio: 'Angel investor and ecosystem builder. 40+ investments across Africa and Southeast Asia. Board member of two climate-tech companies. Based between London and Lagos.',
    status: 'off_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=james',
    social_links: {
      twitter: 'https://twitter.com/jamesachebe_vc',
      linkedin: 'https://linkedin.com/in/jamesachebe',
      website: 'https://jamesachebe.com',
    },
  },
  {
    name: 'Valentina Rossi',
    email: 'valentina.rossi@example.com',
    email_visible: false,
    specialty: 'Operations / Finance',
    building: 'Revenue operations infrastructure for multi-currency SaaS businesses',
    bio: 'RevOps specialist who has built billing systems for three European SaaS companies from seed to Series B. Spreadsheets are a crutch — automation is the answer.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=valentina',
    social_links: {
      linkedin: 'https://linkedin.com/in/valentinarossi',
    },
  },
  {
    name: 'Andre Nkosi',
    email: 'andre.nkosi@example.com',
    email_visible: true,
    specialty: 'Hardware / Robotics',
    building: 'Low-cost prosthetics using 3D printing and myoelectric control',
    bio: 'Biomedical engineer and maker. Built the first open-source myoelectric prosthetic arm certified in South Africa. Exploring how to scale manufacturing across the continent.',
    status: 'on_campus',
    avatar_url: 'https://api.dicebear.com/9.x/personas/svg?seed=andre',
    social_links: {
      github: 'https://github.com/andrenkosi',
      twitter: 'https://twitter.com/andrenkosi',
      website: 'https://openhand.africa',
    },
  },
];

async function seed() {
  console.log(`Seeding ${members.length} members...`);

  const { data, error } = await supabase
    .from('members')
    .insert(members)
    .select('id, name');

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✓ Inserted ${data.length} members:`);
  data.forEach((m) => console.log(`  - ${m.name} (${m.id})`));
}

seed();
