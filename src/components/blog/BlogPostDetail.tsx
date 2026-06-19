import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost } from '@/types';

interface BlogPostDetailProps {
  posts: BlogPost[];
}

export default function BlogPostDetail({ posts }: BlogPostDetailProps) {
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / 404
          </span>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Post not found</h1>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to blog
          </Link>
        </div>
      </div>
    );
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="pt-24 section-padding">
      <div className="w-full md:px-12 lg:px-20">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to blog
        </Link>

        {/* Cover image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden mb-10 border border-surface-200 dark:border-white/10"
        >
          <img src={post.cover_image} alt={post.title} className="w-full aspect-video object-cover" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-xs font-mono uppercase tracking-wide text-surface-400 dark:text-surface-500 mb-5">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {date}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} /> {post.read_time} min read</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-10 pb-10 border-b border-surface-200 dark:border-white/10">
            {post.title}
          </h1>

          {/* Content */}
          <div className="prose-custom">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content.replace(/\\n/g, '\n')}
            </ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </div>
  );
}