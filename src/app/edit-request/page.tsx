'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      await fetch('/api/edit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Check your inbox</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                If <span className="font-medium text-[var(--foreground)]">{email}</span> is in the directory, we&apos;ve sent a private edit link. It expires in 24 hours.
              </p>
              <Link href="/" className="inline-block mt-6 text-sm text-[var(--foreground)] font-medium hover:underline">
                ← Back to directory
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">Update your profile</h1>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Enter the email you used when joining and we&apos;ll send a private link to edit your profile.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="border border-[var(--border)] rounded-2xl p-6 bg-white shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-[var(--border)] focus:border-[var(--border-strong)] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-2)] bg-white transition-colors"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button type="submit" disabled={loading || !email.trim()} className="btn-primary w-full py-2.5 text-sm">
                  {loading ? 'Sending...' : 'Send Edit Link →'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
