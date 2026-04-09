'use client';

import { useState, useRef, useEffect } from 'react';
import { Member } from '@/types';
import StatusBadge from './StatusBadge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  members?: Partial<Member>[];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function MiniMemberCard({ member }: { member: Partial<Member> }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-3 bg-white hover:border-[var(--border-strong)] transition-colors shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[11px] font-semibold text-[var(--foreground)]">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
            : getInitials(member.name ?? '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 flex-wrap mb-0.5">
            <p className="text-xs font-semibold text-[var(--foreground)] truncate">{member.name}</p>
            {member.status && <StatusBadge status={member.status as Member['status']} size="sm" />}
          </div>
          <p className="text-[11px] text-[var(--muted)] truncate">{member.specialty}</p>
        </div>
      </div>
      <p className="text-[11px] text-[var(--muted)] mt-2 line-clamp-2 leading-relaxed">{member.building}</p>
      <div className="flex gap-2 mt-2 flex-wrap">
        {member.email_visible && member.email && (
          <a href={`mailto:${member.email}`} className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">✉ Email</a>
        )}
        {member.social_links?.twitter && (
          <a href={`https://twitter.com/${member.social_links.twitter}`} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">𝕏 @{member.social_links.twitter}</a>
        )}
        {member.social_links?.github && (
          <a href={`https://github.com/${member.social_links.github}`} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">gh/{member.social_links.github}</a>
        )}
        {member.social_links?.website && (
          <a href={member.social_links.website} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">↗ Website</a>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm the NS Directory agent. Try: \"who's on campus?\", \"find a web3 developer\", or \"show founders\".",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'No results found.', members: data.members ?? [] }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Please try again.', members: [] }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--foreground)] hover:bg-neutral-800 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Open NS agent"
      >
        {open ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 border border-[var(--border-strong)] rounded-2xl bg-white flex flex-col overflow-hidden"
          style={{ height: 520, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-[var(--foreground)]">NS Directory Agent</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--surface)]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[var(--foreground)] text-white rounded-br-sm'
                    : 'bg-white border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.members && msg.members.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {msg.members.map((m, j) => <MiniMemberCard key={j} member={m} />)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[var(--border)] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm text-[var(--muted)] shadow-sm">
                  <span className="animate-pulse">Searching...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center border-t border-[var(--border)] bg-white flex-shrink-0 px-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about members..."
              disabled={loading}
              className="flex-1 px-3.5 py-3 text-sm bg-transparent text-[var(--foreground)] placeholder-[var(--muted-2)] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="mr-2 w-8 h-8 rounded-full bg-[var(--foreground)] text-white flex items-center justify-center disabled:opacity-30 transition-opacity hover:bg-neutral-700 flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
