import { useState } from 'react';
import { motion } from 'framer-motion';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';

interface ProjectsProps {
  projects: Project[];
}

const categories = [
  { key: 'all', label: 'All Projects' },
  { key: 'fullstack', label: 'Full Stack' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'ai', label: 'AI / ML' },
  { key: 'mobile', label: 'Mobile' },
];

export default function ProjectsSection({ projects }: ProjectsProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <section id="projects" className="section-padding">
      <div className="w-full px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Projects
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            Featured Projects
          </h2>
          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            A selection of projects showcasing full-stack development, UI engineering, and creative problem-solving.
          </p>
        </motion.div>

        {/* Category filter — minimal underline tabs */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10 pb-6 border-b border-surface-200 dark:border-white/10">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`text-xs font-mono uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                activeCategory === cat.key
                  ? 'border-primary-600 dark:border-primary-400 text-surface-900 dark:text-white'
                  : 'border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500">
            No projects in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}