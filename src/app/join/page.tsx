'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MemberForm from '@/components/MemberForm';
import { MemberFormData } from '@/types';

export default function JoinPage() {
  const [success, setSuccess] = useState(false);
  const [memberName, setMemberName] = useState('');

  async function handleSubmit(data: MemberFormData) {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to join.');
    setMemberName(data.name);
    setSuccess(true);
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
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Welcome, {memberName}</h2>
          <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
            You&apos;re now in the NS Member Directory. The community can find you and what you&apos;re building.
          </p>
          <Link href="/" className="btn-primary">View Directory →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--border)] bg-white sticky top-8 z-40">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
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
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
            Join the Directory
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Add yourself so the NS community can find you, connect, and collaborate.
          </p>
        </div>

        <div className="border border-[var(--border)] rounded-2xl p-6 bg-white shadow-sm">
          <MemberForm onSubmit={handleSubmit} submitLabel="Join Directory →" />
        </div>

        <p className="text-sm text-[var(--muted)] mt-5 text-center">
          Already listed?{' '}
          <Link href="/edit-request" className="text-[var(--foreground)] font-medium hover:underline">
            Update your profile
          </Link>
        </p>
      </main>
    </div>
  );
}
