import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/members/[token] — fetch member data for editing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: tokenRow, error: tokenError } = await getSupabaseAdmin()
    .from('edit_tokens')
    .select('member_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 404 });
  }

  if (tokenRow.used_at) {
    return NextResponse.json({ error: 'This edit link has already been used.' }, { status: 410 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This edit link has expired. Request a new one.' }, { status: 410 });
  }

  const { data: member, error: memberError } = await getSupabaseAdmin()
    .from('members')
    .select('id, name, email, email_visible, specialty, building, bio, avatar_url, status, social_links')
    .eq('id', tokenRow.member_id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  }

  return NextResponse.json({ member });
}

// PUT /api/members/[token] — update member via edit token
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  // Verify token
  const { data: tokenRow, error: tokenError } = await getSupabaseAdmin()
    .from('edit_tokens')
    .select('member_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 404 });
  }

  if (tokenRow.used_at) {
    return NextResponse.json({ error: 'This edit link has already been used.' }, { status: 410 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This edit link has expired. Request a new one.' }, { status: 410 });
  }

  const { name, email_visible, specialty, building, bio, status, social_links, avatar_url } = body;

  const { error: updateError } = await getSupabaseAdmin()
    .from('members')
    .update({
      name,
      email_visible,
      specialty,
      building,
      bio: bio || null,
      status,
      social_links: social_links || {},
      ...(avatar_url !== undefined ? { avatar_url } : {}),
    })
    .eq('id', tokenRow.member_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Mark token as used
  await getSupabaseAdmin()
    .from('edit_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);

  return NextResponse.json({ success: true });
}
