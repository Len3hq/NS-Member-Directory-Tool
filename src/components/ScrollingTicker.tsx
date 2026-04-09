'use client';

import { useEffect, useState } from 'react';

interface TickerMember {
  name: string;
  specialty: string;
}

export default function ScrollingTicker() {
  const [members, setMembers] = useState<TickerMember[]>([]);

  useEffect(() => {
    fetch('/api/members?limit=20')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMembers((d.members ?? []) as TickerMember[]))
      .catch(() => {}); // ticker is non-critical; fail silently
  }, []);

  if (!members.length) {
    return <div className="h-8 bg-black" />;
  }

  // Duplicate items for seamless infinite loop (animation moves -50%)
  const items = [...members, ...members];

  return (
    <div
      className="h-8 bg-black overflow-hidden flex items-center sticky top-0 z-50"
      aria-hidden="true"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          whiteSpace: 'nowrap',
          animation: 'ticker-scroll 40s linear infinite',
          willChange: 'transform',
        }}
      >
        {items.map((m, i) => (
          <span key={i} style={{ flexShrink: 0, fontSize: '11px', color: '#a3a3a3' }}>
            <span style={{ color: '#f59e0b', fontWeight: 500 }}>{m.name}</span>
            <span style={{ color: '#525252', margin: '0 6px' }}>—</span>
            <span>{m.specialty}</span>
            <span style={{ color: '#3f3f3f', marginLeft: '28px' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
