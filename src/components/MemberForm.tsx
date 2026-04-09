'use client';

import { useState, useRef } from 'react';
import { MemberFormData, MemberStatus } from '@/types';
import { uploadAvatar } from '@/lib/supabase-browser';

interface MemberFormProps {
  initialData?: Partial<MemberFormData> & { avatar_url?: string };
  onSubmit: (data: MemberFormData) => Promise<void>;
  submitLabel?: string;
  isEdit?: boolean;
}

const PRESET_SPECIALTIES = [
  'Software Engineer',
  'Product Manager',
  'Designer (UI/UX)',
  'Founder / Entrepreneur',
  'Investor / VC',
  'Writer / Journalist',
  'Researcher / Academic',
  'Legal / Policy',
  'Marketing / Growth',
  'Operations / Finance',
  'Crypto / Web3',
  'AI / ML Engineer',
  'Data Scientist',
  'Hardware / Robotics',
  'Biotech / Health',
];

const SELECT_CUSTOM = '__custom__';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
      {children}
    </label>
  );
}

function InputClass(extra = '') {
  return `w-full border border-[var(--border)] focus:border-[var(--border-strong)] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-2)] bg-white transition-colors ${extra}`;
}

export default function MemberForm({ initialData, onSubmit, submitLabel = 'Join Directory', isEdit = false }: MemberFormProps) {
  const [form, setForm] = useState<MemberFormData>({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    email_visible: initialData?.email_visible ?? false,
    specialty: initialData?.specialty ?? '',
    building: initialData?.building ?? '',
    bio: initialData?.bio ?? '',
    status: initialData?.status ?? 'on_campus',
    social_links: initialData?.social_links ?? {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Specialty: detect if initial value is custom (not in preset list)
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(
    !!(initialData?.specialty && !PRESET_SPECIALTIES.includes(initialData.specialty))
  );

  const set = (field: keyof MemberFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setSocial = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, social_links: { ...prev.social_links, [field]: value } }));

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.specialty || !form.building) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      let avatar_url = initialData?.avatar_url ?? null;
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile);
      await onSubmit({ ...form, avatar_url } as MemberFormData & { avatar_url: string | null });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--foreground)] bg-[var(--surface-2)] overflow-hidden transition-all group flex items-center justify-center"
        >
          {avatarPreview ? (
            <>
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </>
          ) : (
            <svg className="text-[var(--muted-2)] group-hover:text-[var(--muted)] transition-colors" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
        <span className="text-xs text-[var(--muted)]">
          {avatarPreview ? 'Click to change photo' : 'Add profile photo (optional)'}
        </span>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
      </div>

      {/* Name */}
      <div>
        <Label>Full Name <span className="text-red-500">*</span></Label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
          placeholder="Satoshi Nakamoto" className={InputClass()} />
      </div>

      {/* Email */}
      <div>
        <Label>Email <span className="text-red-500">*</span></Label>
        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com" disabled={isEdit} className={InputClass(isEdit ? 'opacity-50 cursor-not-allowed bg-[var(--surface-2)]' : '')} />
        <p className="text-xs text-[var(--muted)] mt-1.5">
          Used only to send you a profile edit link — never shared without your permission.
        </p>
        <label className="flex items-center gap-2.5 mt-2 cursor-pointer group w-fit">
          <button
            type="button"
            onClick={() => set('email_visible', !form.email_visible)}
            className={`w-9 h-5 rounded-full border-2 relative flex-shrink-0 transition-all duration-200 ${
              form.email_visible ? 'bg-[var(--foreground)] border-[var(--foreground)]' : 'bg-white border-[var(--border-strong)]'
            }`}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${form.email_visible ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
            Show my email publicly in the directory
          </span>
        </label>
      </div>

      {/* Specialty */}
      <div>
        <Label>Specialty / Profession <span className="text-red-500">*</span></Label>
        <select
          value={showCustomSpecialty ? SELECT_CUSTOM : (form.specialty || '')}
          onChange={(e) => {
            if (e.target.value === SELECT_CUSTOM) {
              setShowCustomSpecialty(true);
              set('specialty', '');
            } else {
              setShowCustomSpecialty(false);
              set('specialty', e.target.value);
            }
          }}
          className={InputClass('appearance-none cursor-pointer')}
        >
          <option value="" disabled>Select your specialty...</option>
          {PRESET_SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value={SELECT_CUSTOM}>Other (type your own...)</option>
        </select>
        {showCustomSpecialty && (
          <input
            type="text"
            value={form.specialty}
            onChange={(e) => set('specialty', e.target.value)}
            placeholder="Enter your profession..."
            className={InputClass('mt-2')}
            autoFocus
          />
        )}
      </div>

      {/* Building */}
      <div>
        <Label>What are you building? <span className="text-red-500">*</span></Label>
        <input type="text" value={form.building} onChange={(e) => set('building', e.target.value)}
          placeholder="A decentralized identity protocol..." className={InputClass()} />
      </div>

      {/* Bio */}
      <div>
        <Label>Bio <span className="text-xs font-normal text-[var(--muted)]">(optional)</span></Label>
        <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)}
          placeholder="Tell the community about yourself..."
          rows={3} className={InputClass('resize-none')} />
      </div>

      {/* Status */}
      <div>
        <Label>Current Status</Label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'on_campus', label: 'On Campus', dot: 'bg-emerald-500' },
            { value: 'off_campus', label: 'Off Campus', dot: 'bg-neutral-400' },
            { value: 'remote', label: 'Remote', dot: 'bg-amber-500' },
          ] as { value: MemberStatus; label: string; dot: string }[]).map(({ value, label, dot }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('status', value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm border transition-all duration-150 ${
                form.status === value
                  ? 'border-[var(--foreground)] bg-[var(--surface-2)] text-[var(--foreground)] font-medium'
                  : 'border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--border-strong)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Social links */}
      <div>
        <Label>Social Links <span className="text-xs font-normal text-[var(--muted)]">(optional)</span></Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: 'twitter', placeholder: 'Twitter / X handle' },
            { key: 'linkedin', placeholder: 'LinkedIn handle' },
            { key: 'github', placeholder: 'GitHub username' },
            { key: 'discord', placeholder: 'Discord username' },
            { key: 'website', placeholder: 'Website URL' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="text"
              value={(form.social_links as Record<string, string>)[key] ?? ''}
              onChange={(e) => setSocial(key, e.target.value)}
              placeholder={placeholder}
              className={InputClass()}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
