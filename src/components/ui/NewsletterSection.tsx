import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'subscribed' | 'error'>('idle');
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('submitting');

    try {
      // TODO: replace with your real newsletter API call
      // e.g. await fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      await new Promise(resolve => setTimeout(resolve, 600));

      setStatus('subscribed');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="section-padding">
      <div className="w-full md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Calm breathing glow behind the card — no rotation, so it stays smooth on a wide rectangle */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-primary-600/25 dark:bg-primary-400/20 blur-xl -z-10"
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div className="relative rounded-2xl border border-surface-200 dark:border-white/10 bg-white/90 dark:bg-surface-900/90 bg-[url('/bgImg.svg')] bg-cover bg-center bg-no-repeat backdrop-blur-sm p-8 md:p-12 lg:p-16 overflow-hidden">
            {/* Faint watermark glyph — ties to the developer/mono aesthetic without adding clutter */}
            <span className="pointer-events-none select-none absolute -right-4 -bottom-10 text-[11rem] leading-none font-black text-surface-900/[0.03] dark:text-white/[0.04]">
              @
            </span>

            {/* IDE-style corner brackets, matching the profile photo signature */}
            <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary-600/40 dark:border-primary-400/40 rounded-tl-md" />
            <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary-600/40 dark:border-primary-400/40 rounded-br-md" />

            <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-10">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
                  <Mail size={14} /> Newsletter
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-3">
                  Stay updated
                </h2>
                <p className="text-surface-500 dark:text-surface-400 leading-relaxed">
                  Get notified when I publish new articles about web development, design, and technology.
                </p>
              </div>

              <div className="w-full lg:w-auto lg:min-w-[340px]">
                {status === 'subscribed' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-primary-600/30 dark:border-primary-400/30 bg-primary-600/5 dark:bg-primary-400/5 p-4"
                  >
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      Thanks for subscribing!
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                      You'll hear from me soon.{' '}
                      <button
                        type="button"
                        onClick={() => setStatus('idle')}
                        className="underline hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        Wrong email?
                      </button>
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4" noValidate>
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email address
                      </label>
                      <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        disabled={status === 'submitting'}
                        className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors disabled:opacity-50"
                      />
                      {status === 'error' && (
                        <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                          Something went wrong. Please try again.
                        </p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={status === 'submitting'}
                      whileHover={{ scale: status === 'submitting' ? 1 : 1.02 }}
                      whileTap={{ scale: status === 'submitting' ? 1 : 0.98 }}
                      className="px-6 py-2.5 rounded-lg border border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors shrink-0 font-bold disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
                    >
                      {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}