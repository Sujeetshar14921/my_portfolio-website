import { useState } from 'react';
import { motion } from 'framer-motion';
import { BlogPost } from '@/types';
import BlogCard from './BlogCard';

interface BlogSectionProps {
  posts: BlogPost[];
}

export default function BlogSection({ posts }: BlogSectionProps) {
  const [activeTag, setActiveTag] = useState('all');

  const allTags = [...new Set(posts.flatMap(p => p.tags))];
  const filtered = activeTag === 'all'
    ? posts
    : posts.filter(p => p.tags.includes(activeTag));

  return (
    <section id="blog" className="section-padding bg-white dark:bg-surface-900 transition-colors duration-300">
      <div className="w-full md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Blog
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            Blog &amp; journal
          </h2>
          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            Thoughts on development, design, and the journey of building software.
          </p>
        </motion.div>

        {/* Tag filter — minimal underline tabs */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10 pb-6 border-b border-surface-200 dark:border-white/10">
            <button
              onClick={() => setActiveTag('all')}
              className={`text-xs font-mono uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                activeTag === 'all'
                  ? 'border-primary-600 dark:border-primary-400 text-surface-900 dark:text-white'
                  : 'border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`text-xs font-mono uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                  activeTag === tag
                    ? 'border-primary-600 dark:border-primary-400 text-surface-900 dark:text-white'
                    : 'border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filtered.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500">
            No posts found.
          </div>
        )}
      </div>
    </section>
  );
}