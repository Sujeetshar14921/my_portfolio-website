import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Calendar } from 'lucide-react';
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface ContactProps {
  profile: Profile | null;
}

export default function ContactSection({ profile }: ContactProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const { error } = await supabase.from('contact_submissions').insert({
      name: form.name,
      email: form.email,
      message: form.message,
    });

    if (error) {
      setStatus('error');
    } else {
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    }
  };

  return (
    <section id="contact" className="section-padding">
      <div className="w-full px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Contact
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            Get in touch
          </h2>
          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            Whether you're looking to hire or need a project built, I'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-6"
          >
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
                Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors resize-none"
                placeholder="Tell me about your project or role..."
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent' : 'Send message'}
            </button>

            {status === 'sent' && (
              <p className="text-sm text-accent-600 dark:text-accent-400">
                Message sent successfully. I'll get back to you soon!
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.form>

          {/* Contact links */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            {[
              { icon: Mail, label: 'Email', value: profile?.email || 'alex@alexmorgan.dev', href: `mailto:${profile?.email || 'alex@alexmorgan.dev'}` },
              { icon: LinkedInIcon, label: 'LinkedIn', value: 'Connect with me', href: profile?.linkedin_url || '#' },
              { icon: GitHubIcon, label: 'GitHub', value: 'View my code', href: profile?.github_url || '#' },
              ...(profile?.calendly_url ? [{ icon: Calendar, label: 'Book a Call', value: 'Schedule on Calendly', href: profile.calendly_url }] : []),
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 py-4 border-b border-surface-200 dark:border-white/10 group hover:border-primary-600 dark:hover:border-primary-400 transition-colors"
              >
                <item.icon
                  size={16}
                  className="text-surface-400 dark:text-surface-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0"
                />
                <div>
                  <div className="text-sm font-medium text-surface-900 dark:text-white">{item.label}</div>
                  <div className="text-xs text-surface-400 dark:text-surface-500">{item.value}</div>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}