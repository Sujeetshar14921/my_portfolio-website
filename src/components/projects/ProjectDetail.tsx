import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { GitHubIcon } from '@/components/ui/BrandIcons';
import { Link, useParams } from 'react-router-dom';
import { Project } from '@/types';

interface ProjectDetailProps {
  projects: Project[];
}

export default function ProjectDetail({ projects }: ProjectDetailProps) {
  const { slug } = useParams();
  const project = projects.find(p => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / 404
          </span>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6">Project not found</h1>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft size={14} /> Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 section-padding">
      <div className="w-full px-6 md:px-12 lg:px-20">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to projects
        </Link>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden mb-10 border border-surface-200 dark:border-white/10"
        >
          <img src={project.image_url} alt={project.title} className="w-full aspect-video object-cover" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400">
                  {project.category}
                </span>
                {project.case_study && (
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400">
                    Case Study
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-8 pb-8 border-b border-surface-200 dark:border-white/10">
                {project.title}
              </h1>

              <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{project.full_description}</p>

              {/* Case Study */}
              {project.case_study && (
                <div className="mt-12 border-t border-b border-surface-200 dark:border-white/10 divide-y divide-surface-200 dark:divide-white/10">
                  <div className="py-8">
                    <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
                      The Problem
                    </span>
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{project.case_problem}</p>
                  </div>
                  <div className="py-8">
                    <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
                      The Approach
                    </span>
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{project.case_approach}</p>
                  </div>
                  <div className="py-8">
                    <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
                      The Result
                    </span>
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{project.case_result}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-4">
              Tech Stack
            </span>
            <div className="flex flex-wrap gap-2 mb-8">
              {project.tech_stack.map(tech => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors"
                >
                  <ExternalLink size={14} /> Live demo
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-surface-200 dark:border-white/10 text-surface-600 dark:text-surface-400 text-xs font-mono uppercase tracking-wider hover:border-surface-400 dark:hover:border-white/30 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  <GitHubIcon size={14} /> View source
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}