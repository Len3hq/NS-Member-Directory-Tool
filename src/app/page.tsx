'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Member } from '@/types';
import MemberCard from '@/components/MemberCard';
import MemberModal from '@/components/MemberModal';
import ChatWidget from '@/components/ChatWidget';

const STATUSES = [
  { value: 'all', label: 'All statuses', dot: null },
  { value: 'on_campus', label: 'On Campus', dot: 'bg-emerald-500' },
  { value: 'off_campus', label: 'Off Campus', dot: 'bg-neutral-400' },
];

const SPECIALTIES = [
  'All Specialties',
  'Software Engineer',
  'AI / ML Engineer',
  'Crypto / Web3',
  'Founder / Entrepreneur',
  'Investor / VC',
  'Designer (UI/UX)',
  'Product Manager',
  'Writer / Journalist',
  'Researcher / Academic',
  'Legal / Policy',
  'Marketing / Growth',
  'Data Scientist',
  'Hardware / Robotics',
  'Biotech / Health',
  'Operations / Finance',
  'Other',
];

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (specialtyFilter !== 'All Specialties') params.set('specialty', specialtyFilter);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Failed to load members.');
        setMembers([]);
      } else {
        setMembers(data.members ?? []);
      }
    } catch {
      setFetchError('Network error. Please check your connection and try again.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, specialtyFilter, search]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    if (filterOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  const onCampusCount = members.filter((m) => m.status === 'on_campus').length;
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (specialtyFilter !== 'All Specialties' ? 1 : 0);
  const hasActiveFilter = activeFilterCount > 0 || !!search;

  return (
    <div className="min-h-screen bg-white">
      {/* Header — NS.com style */}
      <header className="border-b border-[var(--border)] bg-white sticky top-8 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image src="/ns-logo.png" alt="NS" width={20} height={20} className="object-contain" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
              Member Directory
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/edit-request" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block">
              Edit profile
            </Link>
            <Link href="/join" className="btn-primary text-sm">
              Join →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        {/* Page title */}
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-1">
            Network School Members
          </h1>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span><span className="text-[var(--foreground)] font-medium">{members.length}</span> members</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-[var(--foreground)]">{onCampusCount}</span> on campus
            </span>
            {hasActiveFilter && (
              <span className="text-[var(--amber)] font-medium text-xs">filtered</span>
            )}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-7">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, specialty, or what they're building..."
              className="w-full border border-[var(--border)] focus:border-[var(--border-strong)] focus:outline-none rounded-md pl-9 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-2)] bg-white transition-colors"
            />
          </div>

          {/* Filter button */}
          <div className="relative flex-shrink-0" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`btn-secondary flex items-center gap-2 text-sm ${filterOpen || activeFilterCount > 0 ? 'border-[var(--foreground)]' : ''}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[var(--foreground)] text-white text-[10px] font-semibold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-68 border border-[var(--border-strong)] rounded-xl bg-white z-30 shadow-lg overflow-hidden" style={{ width: 264 }}>
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setStatusFilter('all'); setSpecialtyFilter('All Specialties'); }}
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Status</p>
                  <div className="space-y-0.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatusFilter(s.value)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                          statusFilter === s.value
                            ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-medium'
                            : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {s.dot
                          ? <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                          : <span className="w-2 h-2 flex-shrink-0" />}
                        {s.label}
                        {statusFilter === s.value && (
                          <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 max-h-60 overflow-y-auto">
                  <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Specialty</p>
                  <div className="space-y-0.5">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpecialtyFilter(s)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-left transition-colors ${
                          specialtyFilter === s
                            ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-medium'
                            : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {s}
                        {specialtyFilter === s && (
                          <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">{fetchError}</p>
            <button
              onClick={fetchMembers}
              className="text-xs font-medium text-red-700 hover:underline flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-[var(--border)] rounded-xl bg-[var(--surface)] animate-pulse h-52" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[var(--muted)] text-sm mb-1">
              {hasActiveFilter ? 'No members match your filters.' : 'No members yet.'}
            </p>
            <p className="text-[var(--muted-2)] text-xs mb-6">
              {hasActiveFilter ? 'Try adjusting your search or filters.' : 'Be the first to join the directory.'}
            </p>
            <Link href="/join" className="btn-primary">Join Directory →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} onClick={setSelectedMember} />
            ))}
          </div>
        )}
      </main>

      {selectedMember && <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      <ChatWidget />
    </div>
  );
}
