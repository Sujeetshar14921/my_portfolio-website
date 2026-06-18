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
  status: 'new' | 'contacted' | 'in_progress' | 'closed';
  notes: string;
  created_at: string;
  updated_at: string;
}

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
