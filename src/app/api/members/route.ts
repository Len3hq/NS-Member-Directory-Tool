import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

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

  if (!name || !email || !specialty) {
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

  // Send welcome confirmation email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const editRequestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/edit-request`;
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email as string,
      subject: 'You\'re now in the NS Member Directory',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="background:#f5f5f5;color:#0a0a0a;font-family:'Courier New',monospace;padding:40px 20px;max-width:520px;margin:0 auto;">
            <div style="border:1px solid #e5e5e5;border-radius:12px;padding:32px;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="color:#f59e0b;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;text-transform:uppercase;font-weight:600;">
                Network School Directory
              </div>
              <h2 style="color:#0a0a0a;font-size:16px;margin:0 0 16px;font-weight:600;">Welcome, ${name}!</h2>
              <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 16px;">
                You have successfully joined the NS Member Directory. The community can now find you, connect, and collaborate.
              </p>
              <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 24px;">
                To update your profile at any time, request an edit link from the directory.
              </p>
              <a href="${editRequestUrl}"
                 style="display:inline-block;background:#f59e0b;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:bold;letter-spacing:0.05em;">
                Update My Profile →
              </a>
              <div style="border-top:1px solid #e5e5e5;margin-top:32px;padding-top:20px;">
                <p style="color:#999;font-size:11px;line-height:1.7;margin:0;">
                  <strong style="color:#777;">Note:</strong> The NS Member Directory is an <strong style="color:#777;">unofficial community tool</strong> — a public good built by Len3, for NS members. It is not affiliated with or endorsed by Network School. Your data is used solely to power the directory.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch {
    // Email failure is non-fatal — member was already created
  }

  return NextResponse.json({ member: data }, { status: 201 });
}
