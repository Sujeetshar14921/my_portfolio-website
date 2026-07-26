/*
# Create remaining application tables

1. New Tables
- `skills` — developer skills with category, proficiency, and icon.
- `projects` — portfolio projects with details, screenshots, tech stack, and case study.
- `blog_posts` — blog articles with content, tags, and publish status.
- `contact_submissions` — form submissions from the contact page (recruiter/client).
- `page_views` — anonymous page visit tracking.

2. Security
- All tables: RLS enabled, anon can read public data, authenticated can CRUD all data.
- This is a single-tenant portfolio site where the admin is the only authenticated user.
*/

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  proficiency integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_skills" ON skills;
CREATE POLICY "select_skills" ON skills FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_skills" ON skills;
CREATE POLICY "insert_skills" ON skills FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_skills" ON skills;
CREATE POLICY "update_skills" ON skills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_skills" ON skills;
CREATE POLICY "delete_skills" ON skills FOR DELETE TO authenticated USING (true);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  screenshots text[] NOT NULL DEFAULT '{}',
  tech_stack text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT '',
  demo_url text NOT NULL DEFAULT '',
  github_url text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  case_study boolean NOT NULL DEFAULT false,
  case_problem text NOT NULL DEFAULT '',
  case_approach text NOT NULL DEFAULT '',
  case_result text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_projects" ON projects;
CREATE POLICY "insert_projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_projects" ON projects;
CREATE POLICY "update_projects" ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_projects" ON projects;
CREATE POLICY "delete_projects" ON projects FOR DELETE TO authenticated USING (true);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  read_time integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_posts" ON blog_posts;
CREATE POLICY "select_blog_posts" ON blog_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_posts" ON blog_posts;
CREATE POLICY "insert_blog_posts" ON blog_posts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_blog_posts" ON blog_posts;
CREATE POLICY "update_blog_posts" ON blog_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_blog_posts" ON blog_posts;
CREATE POLICY "delete_blog_posts" ON blog_posts FOR DELETE TO authenticated USING (true);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  inquiry_type text NOT NULL DEFAULT 'client',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_contact_submissions" ON contact_submissions;
CREATE POLICY "select_contact_submissions" ON contact_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_contact_submissions" ON contact_submissions;
CREATE POLICY "insert_contact_submissions" ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_contact_submissions" ON contact_submissions;
CREATE POLICY "update_contact_submissions" ON contact_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_contact_submissions" ON contact_submissions;
CREATE POLICY "delete_contact_submissions" ON contact_submissions FOR DELETE TO authenticated USING (true);

-- Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_page_views" ON page_views;
CREATE POLICY "select_page_views" ON page_views FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_page_views" ON page_views;
CREATE POLICY "insert_page_views" ON page_views FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_page_views" ON page_views;
CREATE POLICY "delete_page_views" ON page_views FOR DELETE TO authenticated USING (true);

-- No update policy for page_views (write-only)

-- Seed sample skills
INSERT INTO skills (name, category, icon, proficiency, sort_order) VALUES
  ('React', 'Frontend', 'react', 95, 1),
  ('TypeScript', 'Frontend', 'typescript', 90, 2),
  ('Node.js', 'Backend', 'nodejs', 88, 3),
  ('Python', 'Backend', 'python', 85, 4),
  ('PostgreSQL', 'Database', 'postgresql', 82, 5),
  ('AWS', 'Cloud', 'aws', 78, 6),
  ('Docker', 'DevOps', 'docker', 75, 7),
  ('GraphQL', 'API', 'graphql', 72, 8),
  ('Tailwind CSS', 'Frontend', 'tailwindcss', 90, 9),
  ('Next.js', 'Frontend', 'nextjs', 85, 10)
ON CONFLICT DO NOTHING;

-- Seed sample projects
INSERT INTO projects (title, slug, description, full_description, image_url, tech_stack, category, demo_url, github_url, featured, case_study, sort_order, published) VALUES
  ('E-Commerce Dashboard', 'ecommerce-dashboard', 'Full-featured admin dashboard for managing products, orders, and analytics.', 'A comprehensive e-commerce management platform built with React and Node.js. Features real-time analytics, inventory management, order processing, and customer insights. The dashboard includes interactive charts, drag-and-drop interfaces, and automated reporting.', 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['React', 'Node.js', 'PostgreSQL', 'Redis'], 'Web Application', 'https://demo.example.com', 'https://github.com/example', true, false, 1, true),
  ('AI Image Generator', 'ai-image-generator', 'AI-powered image generation tool using Stable Diffusion and custom models.', 'An innovative web application that leverages state-of-the-art AI models to generate custom images from text prompts. Built with a modern React frontend and Python backend, featuring real-time generation, image editing, and social sharing capabilities.', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Python', 'React', 'FastAPI', 'PyTorch'], 'AI/ML', 'https://demo.example.com', 'https://github.com/example', true, false, 2, true),
  ('SaaS CRM Platform', 'saas-crm-platform', 'Customer relationship management platform for modern businesses.', 'A scalable CRM solution designed for growing businesses. Features contact management, deal tracking, automated workflows, email integration, and advanced analytics. Built with a microservices architecture for maximum scalability and reliability.', 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Next.js', 'TypeScript', 'Supabase', 'Stripe'], 'SaaS', 'https://demo.example.com', 'https://github.com/example', false, true, 3, true),
  ('Real-Time Chat App', 'realtime-chat', 'End-to-end encrypted messaging with real-time features.', 'A secure messaging application featuring end-to-end encryption, real-time messaging, group chats, file sharing, and voice messages. Built with WebSocket technology for instant delivery and React Native for cross-platform support.', 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['React', 'Socket.io', 'Node.js', 'MongoDB'], 'Mobile App', 'https://demo.example.com', 'https://github.com/example', false, false, 4, true)
ON CONFLICT DO NOTHING;

-- Seed sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, tags, read_time, published, published_at) VALUES
  ('Building Scalable React Applications', 'building-scalable-react-apps', 'Best practices for structuring large React applications with performance in mind.', 'React applications can grow complex quickly. This post covers component architecture, state management strategies, performance optimization techniques, and testing approaches that help maintain code quality at scale. We explore patterns like compound components, custom hooks, and lazy loading that make large codebases manageable.', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['React', 'Architecture', 'Performance'], 8, true, now()),
  ('Introduction to Server Components', 'introduction-to-server-components', 'Understanding React Server Components and how they change the way we build web apps.', 'React Server Components represent a paradigm shift in how we build React applications. This article explores the benefits of rendering components on the server, reducing client-side JavaScript, and improving initial page load performance. We also discuss the integration with existing React patterns and when to use Server vs Client Components.', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['React', 'Next.js', 'Server Components'], 6, true, now()),
  ('Database Design Patterns for Modern Apps', 'database-design-patterns', 'Essential database patterns every developer should know for building robust applications.', 'Good database design is the foundation of any application. This post covers normalization vs denormalization, indexing strategies, connection pooling, query optimization, and when to use NoSQL vs SQL databases. We also explore patterns like CQRS, event sourcing, and materialized views for complex scenarios.', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['Database', 'PostgreSQL', 'Architecture'], 10, true, now())
ON CONFLICT DO NOTHING;
