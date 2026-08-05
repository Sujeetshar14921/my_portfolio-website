import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'Information we collect',
    body: 'We may collect basic information such as your name, email address, and any message you send through the contact form. We also collect anonymous usage data to understand site performance and improve the experience.',
  },
  {
    title: 'How we use your information',
    body: 'Your information is used to respond to your inquiries, improve the website, and send occasional updates when you explicitly opt in.',
  },
  {
    title: 'Cookies and analytics',
    body: 'We may use cookies and analytics tools to measure traffic and improve site functionality. You can disable cookies in your browser settings if you prefer.',
  },
  {
    title: 'Data protection',
    body: 'We take reasonable measures to protect your information, but no online service can guarantee absolute security.',
  },
  {
    title: 'Contact',
    body: 'If you have any questions about this policy, please contact us at sujeetsharmadc56@gmail.com.',
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Privacy Policy | Sujeet Sharma';
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
              / Privacy Policy
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-2xl text-surface-600 dark:text-surface-400 leading-relaxed">
              This privacy policy explains how Sujeet Sharma collects, uses, and protects your information when you visit this website.
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
                      If you have any questions about this policy, please contact us at{' '}
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