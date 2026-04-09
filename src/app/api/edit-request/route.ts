import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const db = getSupabaseAdmin();

  // Find member by email
  const { data: member, error } = await db
    .from('members')
    .select('id, name, email')
    .eq('email', email)
    .single();

  // Always return success to avoid email enumeration
  if (error || !member) {
    return NextResponse.json({ success: true });
  }

  // Generate a secure token (expires in 24 hours)
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.from('edit_tokens').insert({
    member_id: member.id,
    token,
    expires_at: expiresAt,
  });

  const editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/edit/${token}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: member.email,
      subject: 'Your NS Directory edit link',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="background:#f5f5f5;color:#0a0a0a;font-family:'Courier New',monospace;padding:40px 20px;max-width:520px;margin:0 auto;">
            <div style="border:1px solid #e5e5e5;border-radius:12px;padding:32px;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <div style="color:#f59e0b;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;text-transform:uppercase;font-weight:600;">
                Network School Directory
              </div>
              <h2 style="color:#0a0a0a;font-size:16px;margin:0 0 16px;font-weight:600;">Hi ${member.name},</h2>
              <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 24px;">
                Here is your private link to update your NS Directory profile. This link expires in 24 hours and can only be used once.
              </p>
              <a href="${editUrl}"
                 style="display:inline-block;background:#f59e0b;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:bold;letter-spacing:0.05em;">
                Edit My Profile →
              </a>
              <p style="color:#999;font-size:11px;margin-top:24px;line-height:1.6;">
                If you did not request this, you can safely ignore this email.<br/>
                Link: <a href="${editUrl}" style="color:#777;">${editUrl}</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch {
    // Email sending failed — still return success to avoid enumeration
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true });
}
