import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/members — list all members (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const specialty = searchParams.get('specialty');
  const search = searchParams.get('search');
  const limit = searchParams.get('limit');

  let query = getSupabaseAdmin()
    .from('members')
    .select('id, name, email, email_visible, specialty, building, bio, avatar_url, status, social_links, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (specialty && specialty !== 'all') {
    query = query.eq('specialty', specialty);
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,specialty.ilike.%${search}%,building.ilike.%${search}%,bio.ilike.%${search}%`
    );
  }
  if (limit) {
    const n = parseInt(limit, 10);
    if (!isNaN(n) && n > 0) query = query.limit(n);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Never expose email when email_visible is false
  const sanitized = data.map((m) => ({
    ...m,
    email: m.email_visible ? m.email : null,
  }));

  return NextResponse.json({ members: sanitized });
}

// POST /api/members — create a new member
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { name, email, email_visible, specialty, building, bio, status, social_links, avatar_url } = body;

  if (!name || !email || !specialty || !building) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Check if email already exists
  const { data: existing } = await getSupabaseAdmin()
    .from('members')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'A member with this email already exists. Use the edit link to update your profile.' },
      { status: 409 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from('members')
    .insert({
      name,
      email,
      email_visible: email_visible ?? false,
      specialty,
      building,
      bio: bio || null,
      status: status || 'on_campus',
      social_links: social_links || {},
      avatar_url: avatar_url || null,
    })
    .select('id, name, specialty, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data }, { status: 201 });
}
