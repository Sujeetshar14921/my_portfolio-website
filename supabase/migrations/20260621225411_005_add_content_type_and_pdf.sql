-- Add content_type column to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'markdown' CHECK (content_type IN ('html', 'markdown'));

-- Add pdf_url column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pdf_url TEXT;