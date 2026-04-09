'use client';

import { useEffect } from 'react';
import { Member } from '@/types';
import StatusBadge from './StatusBadge';

interface MemberModalProps {
  member: Member;
  onClose: () => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MemberModal({ member, onClose }: MemberModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const joinedDate = new Date(member.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div
        className="relative w-full max-w-md bg-white rounded-2xl border border-[var(--border-strong)] overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center text-lg font-semibold text-[var(--foreground)]">
              {member.avatar_url
                ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                : getInitials(member.name)
              }
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">{member.name}</h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">{member.specialty}</p>
              <div className="mt-2">
                <StatusBadge status={member.status} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[55vh] overflow-y-auto">
          <div>
            <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5">Building</p>
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{member.building}</p>
          </div>

          {member.bio && (
            <div>
              <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1.5">About</p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{member.bio}</p>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Connect</p>
            <div className="flex flex-wrap gap-2">
              {member.email_visible && member.email && (
                <a href={`mailto:${member.email}`}
                  className="btn-secondary text-xs px-3 py-1.5">
                  ✉ Email
                </a>
              )}
              {member.social_links?.twitter && (
                <a href={`https://twitter.com/${member.social_links.twitter}`} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5">
                  𝕏 @{member.social_links.twitter}
                </a>
              )}
              {member.social_links?.linkedin && (
                <a href={`https://linkedin.com/in/${member.social_links.linkedin}`} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5">
                  LinkedIn
                </a>
              )}
              {member.social_links?.github && (
                <a href={`https://github.com/${member.social_links.github}`} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5">
                  GitHub
                </a>
              )}
              {member.social_links?.discord && (
                <span className="btn-secondary text-xs px-3 py-1.5 cursor-default select-all" title="Discord username">
                  Discord: {member.social_links.discord}
                </span>
              )}
              {member.social_links?.website && (
                <a href={member.social_links.website.startsWith('http') ? member.social_links.website : `https://${member.social_links.website}`} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5">
                  ↗ Website
                </a>
              )}
              {!member.email_visible && !member.social_links?.twitter && !member.social_links?.linkedin && !member.social_links?.github && !member.social_links?.discord && !member.social_links?.website && (
                <p className="text-sm text-[var(--muted)]">No public contact info.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">Joined {joinedDate}</span>
          <span className="text-xs text-[var(--muted-2)]">NS Directory</span>
        </div>
      </div>
    </div>
  );
}
