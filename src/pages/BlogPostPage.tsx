import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/types';
import BlogPostDetail from '@/components/blog/BlogPostDetail';

export default function BlogPostPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('published', true)
      .then(({ data }) => { if (data) setPosts(data as BlogPost[]); });
  }, []);

  return <BlogPostDetail posts={posts} />;
}
