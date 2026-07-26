import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { GitHubIcon } from '@/components/ui/BrandIcons';
import { Link } from 'react-router-dom';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group rounded-2xl border border-surface-200 dark:border-white/10 bg-white/60 dark:bg-surface-900/40 overflow-hidden transition-colors duration-300 hover:border-primary-600/40 dark:hover:border-primary-400/40"
    >
      {/* Image / placeholder block */}
      <Link
        to={`/projects/${project.slug}`}
        className="relative block aspect-video overflow-hidden bg-surface-50 dark:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 focus-visible:ring-inset"
      >
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-surface-400 dark:text-surface-500">
              {project.title}
            </span>
          </div>
        )}

        {/* Gradient for badge legibility over bright images */}
        {(project.case_study || project.featured) && (
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        )}

        {project.case_study && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest border border-white/20 bg-black/40 backdrop-blur-sm text-white">
            Case Study
          </span>
        )}
        {project.featured && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest border border-primary-400/40 bg-primary-600/70 backdrop-blur-sm text-white">
            Featured
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <Link
            to={`/projects/${project.slug}`}
            className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
          >
            {project.title}
            <ArrowRight
              size={14}
              className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </Link>

          <div className="flex items-center gap-3 shrink-0 pt-0.5">
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
                aria-label="Live demo"
              >
                <ExternalLink size={14} />
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
                aria-label="GitHub"
              >
                <GitHubIcon size={14} />
              </a>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech_stack.slice(0, 4).map(tech => (
            <span
              key={tech}
              className="px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span className="px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-400 dark:text-surface-500">
              +{project.tech_stack.length - 4}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}