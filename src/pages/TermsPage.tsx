import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'Use of the website',
    body: 'You may use this website for informational and personal purposes. Any misuse, abusive behavior, or unauthorized access is not permitted.',
  },
  {
    title: 'Intellectual property',
    body: 'All content, design, and branding on this website belong to Sujeet Sharma unless otherwise stated.',
  },
  {
    title: 'Limitation of liability',
    body: 'This site is provided "as is" and we do not guarantee uninterrupted access or error-free performance.',
  },
  {
    title: 'Contact',
    body: 'For questions about these terms, contact sujeetsharmadc56@gmail.com.',
  },
];

export default function TermsPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Terms of Service | Sujeet Sharma';
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <>
      <section className="relative w-full pt-24 pb-20 bg-[url('/bgImg.svg')] bg-cover bg-center bg-no-repeat">
        <div className="w-full px-6 md:px-12 lg:px-32">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-10"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
              / Terms of Service
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="mt-4 max-w-2xl text-surface-600 dark:text-surface-400 leading-relaxed">
              By using this website, you agree to the terms below. These terms may be updated from time to time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-surface-200 dark:border-white/10 bg-white/80 dark:bg-surface-900/70 backdrop-blur-sm p-6 sm:p-8 lg:p-10 divide-y divide-surface-200 dark:divide-white/10"
          >
            {SECTIONS.map(s => (
              <div key={s.title} className="py-6 first:pt-0 last:pb-0">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  {s.title}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-surface-600 dark:text-surface-400">
                  {s.title === 'Contact' ? (
                    <>
                      For questions about these terms, contact{' '}
                      <a
                        href="mailto:sujeetsharmadc56@gmail.com"
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        sujeetsharmadc56@gmail.com
                      </a>
                      .
                    </>
                  ) : (
                    s.body
                  )}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}