import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/types';
import BlogSection from '@/components/blog/BlogSection';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('published', true).order('published_at', { ascending: false })
      .then(({ data }) => { if (data) setPosts(data as BlogPost[]); });
  }, []);

  return (
    <div className="pt-20">
      <BlogSection posts={posts} />
    </div>
  );
}
