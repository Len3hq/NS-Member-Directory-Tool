'use client';

import { Member } from '@/types';
import StatusBadge from './StatusBadge';

interface MemberCardProps {
  member: Member;
  onClick: (member: Member) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MemberCard({ member, onClick }: MemberCardProps) {
  return (
    <button
      onClick={() => onClick(member)}
      className="group w-full text-left relative border border-[var(--border)] rounded-xl p-5 bg-white hover:border-[var(--border-strong)] hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* Status top-right */}
      <div className="absolute top-4 right-4">
        <StatusBadge status={member.status} size="sm" />
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4 pr-24">
        <div className="w-11 h-11 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-sm font-semibold text-[var(--foreground)] flex-shrink-0 overflow-hidden">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
            : getInitials(member.name)
          }
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-[var(--foreground)] truncate leading-tight">
            {member.name}
          </h3>
          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{member.specialty}</p>
        </div>
      </div>

      {/* Building */}
      <div className="mb-3 pb-3 border-b border-[var(--border)]">
        <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Building</p>
        <p className="text-sm text-[var(--foreground)] line-clamp-2 leading-snug">{member.building}</p>
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed mb-3">{member.bio}</p>
      )}

      {/* Social icons + view hint */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex gap-2">
          {member.email_visible && member.email && (
            <span className="text-[var(--muted-2)] text-xs">✉</span>
          )}
          {member.social_links?.twitter && <span className="text-[var(--muted-2)] text-xs">𝕏</span>}
          {member.social_links?.github && <span className="text-[var(--muted-2)] text-xs font-mono text-[10px]">gh</span>}
          {member.social_links?.linkedin && <span className="text-[var(--muted-2)] text-xs font-mono text-[10px]">in</span>}
          {member.social_links?.discord && <span className="text-[var(--muted-2)] text-xs font-mono text-[10px]">dc</span>}
          {member.social_links?.website && <span className="text-[var(--muted-2)] text-xs">↗</span>}
        </div>
        <span className="text-[11px] text-[var(--muted-2)] opacity-0 group-hover:opacity-100 transition-opacity">
          View profile →
        </span>
      </div>
    </button>
  );
}
