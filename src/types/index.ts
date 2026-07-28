export interface Profile {
  id: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  photo_url: string;
  resume_url: string;
  linkedin_url: string;
  github_url: string;
  email: string;
  calendly_url: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  achievements: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string;
  proficiency: number;
  sort_order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  full_description: string;
  image_url: string;
  pdf_url?: string;
  screenshots: string[];
  tech_stack: string[];
  category: string;
  demo_url: string;
  github_url: string;
  featured: boolean;
  case_study: boolean;
  case_problem: string;
  case_approach: string;
  case_result: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_type?: 'html' | 'markdown';
  cover_image: string;
  tags: string[];
  read_time: number;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  inquiry_type: 'recruiter' | 'client';
  message: string;
  status: LeadStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  phone: string | null;
  company: string | null;
  budget: string | null;
  service: string | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_sent_at: string | null;
  meeting_status: MeetingStatus;
}

export type LeadStatus =
  | 'pending_verification'
  | 'verified'
  | 'new'
  | 'contacted'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'proposal_sent'
  | 'won'
  | 'lost';

export type MeetingStatus = 'none' | 'scheduled' | 'completed' | 'cancelled';

export type MeetingLiveStatus =
  | 'scheduled'
  | 'waiting_for_host'
  | 'host_joined'
  | 'client_joined'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Meeting {
  id: string;
  lead_id: string | null;
  title: string;
  agenda: string;
  meeting_type: 'one_on_one' | 'group';
  meeting_url: string;
  secure_token: string;
  meeting_date: string;
  meeting_time: string;
  duration: number;
  status: MeetingLiveStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  email: string;
  name: string | null;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  role: 'host' | 'client';
  joined_at: string | null;
  left_at: string | null;
  is_online: boolean;
  created_at: string;
}

export interface MeetingChatMessage {
  id: string;
  meeting_id: string;
  sender_name: string;
  sender_role: 'host' | 'client';
  message: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  lead_id: string | null;
  meeting_id: string | null;
  type: ActivityLogType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ActivityLogType =
  | 'lead_created'
  | 'email_sent'
  | 'verification'
  | 'status_change'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'meeting_started'
  | 'meeting_ended'
  | 'participant_joined'
  | 'participant_left'
  | 'note_added'
  | 'proposal_sent'
  | 'follow_up_sent';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar_url: string;
  content: string;
  sort_order: number;
  published: boolean;
}

export interface PageView {
  id: string;
  page_path: string;
  referrer: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  verified: boolean;
  verification_token: string;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}
