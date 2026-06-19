import { Link } from 'react-router-dom';
import { Mail, ArrowUp } from 'lucide-react';
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Footer() {
  const [scrollHover, setScrollHover] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="w-full bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-white/10 transition-colors duration-300">
      <div className="px-6 md:px-12 py-16">
        <div className="w-full md:px-12 lg:px-20">
          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold uppercase text-surface-900 dark:text-white mb-3">
                Sujeet Sharma
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                Full Stack Developer building exceptional digital experiences with modern web technologies.
              </p>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-5">
                Navigation
              </span>
              <div className="flex flex-col gap-3">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/projects', label: 'Projects' },
                  { to: '/blog', label: 'Blog' },
                  { to: '/contact', label: 'Contact' },
                ].map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Social & Connect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-5">
                Connect
              </span>
              <div className="flex flex-col gap-3">
                <a
                  href="https://github.com/Sujeetshar14921"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <GitHubIcon size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/sujeet-sharma-13090326b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <LinkedInIcon size={14} /> LinkedIn
                </a>
                <a
                  href="mailto:sujeetsharmadc56@gmail.com"
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <Mail size={14} /> Email
                </a>
              </div>
            </motion.div>

            {/* Scroll to Top */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-start md:items-end justify-start h-full"
            >
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Back to Top
              </span>
              <motion.button
                onClick={scrollToTop}
                onMouseEnter={() => setScrollHover(true)}
                onMouseLeave={() => setScrollHover(false)}
                className="group relative p-3 rounded-full mt-20 border border-surface-200 dark:border-white/10 text-surface-600 dark:text-surface-400 hover:border-primary-600 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
                aria-label="Scroll to top"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    y: scrollHover ? -4 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ArrowUp size={18} />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-surface-200 dark:via-white/10 to-transparent mb-8" />

          {/* Bottom section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <p className="text-xs font-mono text-surface-400 dark:text-surface-500">
              &copy; {new Date().getFullYear()} Sujeet Sharma. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <a
                href="#privacy"
                className="text-xs font-mono text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Privacy
              </a>
              <div className="w-px h-4 bg-surface-200 dark:bg-white/10" />
              <a
                href="#terms"
                className="text-xs font-mono text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Terms
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}