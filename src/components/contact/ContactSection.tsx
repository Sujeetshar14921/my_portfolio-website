import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Calendar, User, AtSign, Phone, Building2, Wallet, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { GitHubIcon, LinkedInIcon } from '@/components/ui/BrandIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface ContactProps {
  profile: Profile | null;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const inquiryType = 'client' as const;

export default function ContactSection({ profile }: ContactProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '', phone: '', company: '', budget: '', service: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.message.trim()) nextErrors.message = 'Please add a short message.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');

    const token = randomToken();
    const { error } = await supabase.from('contact_submissions').insert({
      name: form.name,
      email: form.email,
      inquiry_type: inquiryType,
      message: form.message,
      phone: form.phone || null,
      company: form.company || null,
      budget: form.budget || null,
      service: form.service || null,
      status: 'pending_verification',
      email_verified: false,
      verification_token: token,
    });

    if (error) {
      setStatus('error');
      return;
    }

    // Fire-and-forget verification email via edge function
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-api`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'send_lead_verification', lead_id: null, token }),
      });
    } catch {
      // Email failure is non-blocking — lead is already saved
    }

    setStatus('sent');
    setForm({ name: '', email: '', message: '', phone: '', company: '', budget: '', service: '' });
    setErrors({});
  };

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const fieldWrap = "relative";
  const inputClass = "peer w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 pl-6 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors";
  const iconClass = "absolute left-0 bottom-2.5 text-surface-400 dark:text-surface-600 peer-focus:text-primary-600 dark:peer-focus:text-primary-400 transition-colors";
  const labelClass = "block text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2";

  return (
    <section id="contact" className="relative section-padding overflow-hidden">
      {/* Background image — a real <img> instead of a CSS background so it can
          lazy-load and doesn't block first paint. Sits behind everything via -z-10. */}
      <img
        src="/bgImg.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none select-none absolute inset-0 -z-10 h-full w-full object-cover object-center"
      />
      {/* Readability overlay — fades the artwork toward the page background so
          text stays legible regardless of what's in the SVG, in both themes. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/40 via-transparent to-white/40 dark:from-surface-950/40 dark:via-transparent dark:to-surface-950/40" />

      <div className="relative w-full md:px-12 lg:px-20">
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
            Let's build something
          </h2>
          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            Have a project in mind? Share a few details below and I'll get back to you within a day or two.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 relative rounded-2xl border border-surface-200 dark:border-white/10 bg-white/70 dark:bg-surface-900/60 backdrop-blur-sm p-6 md:p-8 space-y-7 overflow-hidden"
            aria-labelledby="contact-heading"
          >
            {/* IDE-style corner brackets to echo the site's signature detail */}
            <span className="pointer-events-none absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary-600/30 dark:border-primary-400/30 rounded-tl-md" />
            <span className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary-600/30 dark:border-primary-400/30 rounded-br-md" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={fieldWrap}>
                <label className={labelClass}>Name</label>
                <User size={14} className={iconClass} />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={update('name')}
                  className={inputClass}
                  placeholder="Your name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                />
                {errors.name && <p id="contact-name-error" className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div className={fieldWrap}>
                <label className={labelClass}>Email</label>
                <AtSign size={14} className={iconClass} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  className={inputClass}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                />
                {errors.email && <p id="contact-email-error" className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Phone <span className="normal-case text-surface-400 dark:text-surface-600">(optional)</span>
                </label>
                <Phone size={14} className={iconClass} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  className={inputClass}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Company <span className="normal-case text-surface-400 dark:text-surface-600">(optional)</span>
                </label>
                <Building2 size={14} className={iconClass} />
                <input
                  type="text"
                  value={form.company}
                  onChange={update('company')}
                  className={inputClass}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Budget <span className="normal-case text-surface-400 dark:text-surface-600">(optional)</span>
                </label>
                <Wallet size={14} className={iconClass} />
                <input
                  type="text"
                  value={form.budget}
                  onChange={update('budget')}
                  className={inputClass}
                  placeholder="e.g. $10k – $25k"
                />
              </div>
              <div className={fieldWrap}>
                <label className={labelClass}>
                  Service <span className="normal-case text-surface-400 dark:text-surface-600">(optional)</span>
                </label>
                <Wrench size={14} className={iconClass} />
                <input
                  type="text"
                  value={form.service}
                  onChange={update('service')}
                  className={inputClass}
                  placeholder="e.g. Web Development"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={update('message')}
                className="w-full bg-transparent border-b border-surface-200 dark:border-white/10 pb-2.5 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-600 focus:border-primary-600 dark:focus:border-primary-400 outline-none transition-colors resize-none"
                placeholder="Tell me about your project..."
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
              />
              {errors.message && <p id="contact-message-error" className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.message}</p>}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex items-center justify-center gap-2 px-6 py-3 border rounded-lg border-surface-900 dark:border-white text-surface-900 dark:text-white text-xs font-mono uppercase tracking-wider hover:bg-surface-900 hover:text-white dark:hover:bg-white dark:hover:text-surface-900 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400"
              >
                <Send size={14} className={status === 'sending' ? 'animate-pulse' : ''} />
                {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent' : 'Send message'}
              </button>

              {status === 'sent' && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-surface-400 dark:text-surface-600"
                >
                  Check your inbox to confirm.
                </motion.span>
              )}
            </div>

            {status === 'sent' && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-sm text-accent-600 dark:text-accent-400 -mt-3"
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                Thanks for reaching out! I've sent a verification email to your inbox — please confirm your email so I can review your inquiry.
              </motion.p>
            )}
            {status === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 -mt-3"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                Something went wrong. Please try again.
              </motion.p>
            )}
          </motion.form>

          {/* Contact links */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <p id="contact-heading" className="text-xs font-mono uppercase tracking-wider text-surface-400 dark:text-surface-600 mb-4">
              Or reach me directly
            </p>
            <div className="rounded-2xl border border-surface-200 dark:border-white/10 bg-white/70 dark:bg-surface-900/60 backdrop-blur-sm divide-y divide-surface-200 dark:divide-white/10 overflow-hidden">
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
                  className="flex items-center gap-4 px-5 py-4 group hover:bg-surface-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-100 dark:bg-white/5 text-surface-400 dark:text-surface-500 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors shrink-0">
                    <item.icon size={15} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-surface-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-surface-400 dark:text-surface-500">{item.value}</div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}