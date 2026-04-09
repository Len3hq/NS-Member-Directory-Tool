'use client';

import { MemberStatus } from '@/types';

const statusConfig: Record<MemberStatus, { label: string; textColor: string; dotColor: string; bg: string }> = {
  on_campus: {
    label: 'On Campus',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
    bg: 'bg-emerald-50',
  },
  off_campus: {
    label: 'Off Campus',
    textColor: 'text-neutral-500',
    dotColor: 'bg-neutral-400',
    bg: 'bg-neutral-50',
  },
  remote: {
    label: 'Remote',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
    bg: 'bg-amber-50',
  },
};

interface StatusBadgeProps {
  status: MemberStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = statusConfig[status];
  const dot = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg} ${c.textColor} ${text} font-medium`}>
      <span className={`${dot} rounded-full ${c.dotColor} flex-shrink-0`} />
      {c.label}
    </span>
  );
}
