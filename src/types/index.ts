export type MemberStatus = 'on_campus' | 'off_campus' | 'remote';

export interface Member {
  id: string;
  name: string;
  email: string;
  email_visible: boolean;
  specialty: string;
  building: string;
  bio: string | null;
  avatar_url: string | null;
  status: MemberStatus;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    discord?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MemberFormData {
  name: string;
  email: string;
  email_visible: boolean;
  specialty: string;
  building: string;
  bio: string;
  status: MemberStatus;
  avatar_url?: string | null;
  social_links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    discord?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
