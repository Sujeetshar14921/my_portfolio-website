import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { verifyLeadEmail } from '@/lib/crm';

export default function LeadVerifyPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    (async () => {
      const res = await verifyLeadEmail(token);
      if (res.ok && res.name) {
        setName(res.name);
        setState('success');
      } else if (res.ok) {
        setState('success');
      } else {
        setState('error');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 text-center">
          <div className="inline-flex w-14 h-14 rounded-xl gradient-bg items-center justify-center mb-6">
            <Mail className="text-white" size={26} />
          </div>

          {state === 'loading' && (
            <>
              <Loader2 className="animate-spin mx-auto text-primary-500 mb-4" size={32} />
              <h1 className="text-xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-surface-500 text-sm">Please wait a moment.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-14 h-14 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-accent-600" size={32} />
              </div>
              <h1 className="text-xl font-bold mb-2">Email Verified!</h1>
              <p className="text-surface-500 text-sm mb-6">
                {name ? `Thanks, ${name}! ` : ''}Your email has been verified successfully. I'll review your inquiry and get back to you soon.
              </p>
              <Link to="/" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Visit Portfolio
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
              <p className="text-surface-500 text-sm mb-6">
                This verification link is invalid or has already been used. If you believe this is an error, please submit the contact form again.
              </p>
              <Link to="/contact" className="inline-block px-6 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                Back to Contact
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
