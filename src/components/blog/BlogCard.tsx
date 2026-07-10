import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/types';

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export default function BlogCard({ post, index }: BlogCardProps) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white dark:bg-surface-900  overflow-hidden shadow-sm border border-surface-200 dark:border-surface-700 card-hover bg-[url('bgImg.svg')] bg-cover bg-center bg-no-repeat"
    >
      <div className="relative overflow-hidden aspect-[16/9]">
        <img
          src={post.cover_image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400 mb-3">
          <span>{date}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {post.read_time} min read</span>
        </div>

        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400">
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
        >
          Read More <ArrowRight size={14} />
        </Link>
      </div>
    </motion.article>
  );
}
