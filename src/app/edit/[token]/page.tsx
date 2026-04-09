'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import MemberForm from '@/components/MemberForm';
import { Member, MemberFormData } from '@/types';

export default function EditProfilePage() {
  const params = useParams();
  const token = params.token as string;
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchMember() {
      try {
        const res = await fetch(`/api/members/${token}`);
        const data = await res.json();
        if (!res.ok) setError(data.error || 'Invalid or expired link.');
        else setMember(data.member);
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchMember();
  }, [token]);

  async function handleSubmit(data: MemberFormData) {
    const res = await fetch(`/api/members/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update profile.');
    setSuccess(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-[var(--muted)] animate-pulse">Verifying link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Link error</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">{error}</p>
          <Link href="/edit-request" className="btn-primary">Request a new link →</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Profile updated</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Your changes are live in the directory.</p>
          <Link href="/" className="btn-primary">View Directory →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black rounded flex items-center justify-center overflow-hidden">
              <Image src="/ns-logo.png" alt="NS" width={20} height={20} className="object-contain" />
            </div>
            <span className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">← Directory</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">Edit your profile</h1>
          <p className="text-sm text-[var(--muted)]">This link expires after use. Request a new one anytime.</p>
        </div>

        <div className="border border-[var(--border)] rounded-2xl p-6 bg-white shadow-sm">
          {member && (
            <MemberForm
              initialData={{
                name: member.name,
                email: member.email,
                email_visible: member.email_visible,
                specialty: member.specialty,
                building: member.building,
                bio: member.bio ?? '',
                status: member.status,
                social_links: member.social_links,
                avatar_url: member.avatar_url ?? '',
              }}
              onSubmit={handleSubmit}
              submitLabel="Save Changes →"
              isEdit={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}
