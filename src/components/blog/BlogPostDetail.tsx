import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPost } from '@/types';

interface BlogPostDetailProps {
  post: BlogPost;
}

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="pt-24 section-padding">
      <div className="w-full md:px-12 lg:px-20">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {/* Cover image */}
        {post.cover_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden mb-8 shadow-lg"
          >
            <img src={post.cover_image} alt={post.title} className="w-full aspect-video object-cover" />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-4">
            {date && <span className="flex items-center gap-1"><Calendar size={14} /> {date}</span>}
            <span className="flex items-center gap-1"><Clock size={14} /> {post.read_time} min read</span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-8">{post.title}</h1>

          {/* Content */}
          <div className="prose-custom">
            {post.content_type === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\\n/g, '\n') }} />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content.replace(/\\n/g, '\n')}
              </ReactMarkdown>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
