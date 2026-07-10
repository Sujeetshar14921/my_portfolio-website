import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="section-padding ">
      <div className="w-full md:px-12 lg:px-20 ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-surface-200 dark:border-white/10 p-8 md:p-12 lg:p-16 "
          style={{
            boxShadow: `
              -3px -3px 0px 0px #FF006E,
              -6px -6px 0px 0px #FB5607,
              -9px -9px 0px 0px #FFBE0B,
              3px 3px 0px 0px #8338EC,
              6px 6px 0px 0px #3A86FF,
              9px 9px 0px 0px #06FFA5,
              -3px 3px 0px 0px #FF5D00,
              3px -3px 0px 0px #FF0080
            `,
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-3">
                Stay updated
              </h2>
              <p className="text-surface-500 dark:text-surface-400 leading-relaxed">
                Get notified when I publish new articles about web development, design, and technology.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[340px]">
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-surface-200 dark:border-white/10 p-4"
                >
                  <p className="text-sm font-medium text-surface-900 dark:text-white">Thanks for subscribing!</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">You'll hear from me soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 border border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors shrink-0 font-bold"
                  >
                    Subscribe
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}