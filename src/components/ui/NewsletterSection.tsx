import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { subscribeToNewsletter, isValidEmail } from '@/lib/newsletter';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const requestId = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    const currentId = ++requestId.current;
    setStatus('loading');
    setMessage('');

    const result = await subscribeToNewsletter(trimmed);

    // Drop stale responses (e.g. user typed again mid-request).
    if (currentId !== requestId.current) return;

    if (result.ok) {
      setStatus('success');
      setMessage(result.message);
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  };

  const reset = () => {
    if (status === 'error') {
      setStatus('idle');
      setMessage('');
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
                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    role="status"
                    className="rounded-xl border border-primary-600/30 dark:border-primary-400/30 bg-primary-600/5 dark:bg-primary-400/5 p-4 flex items-start gap-3"
                  >
                    <CheckCircle2 size={20} className="shrink-0 text-primary-600 dark:text-primary-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        Thanks for subscribing!
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                        {message}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setStatus('idle');
                            setMessage('');
                          }}
                          className="underline hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          Wrong email?
                        </button>
                      </p>
                    </div>
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
                        onChange={e => {
                          setEmail(e.target.value);
                          reset();
                        }}
                        placeholder="your@email.com"
                        disabled={status === 'loading'}
                        aria-invalid={status === 'error'}
                        aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                        className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors disabled:opacity-50"
                      />
                      {status === 'error' && (
                        <p
                          id="newsletter-error"
                          role="alert"
                          className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5"
                        >
                          <AlertCircle size={14} className="shrink-0" />
                          {message}
                        </p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={status === 'loading'}
                      whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                      whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                      className="px-6 py-2.5 rounded-lg border border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors shrink-0 font-bold disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 flex items-center justify-center gap-2"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Subscribing…
                        </>
                      ) : (
                        'Subscribe'
                      )}
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