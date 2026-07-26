import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { confirmSubscription } from '@/lib/newsletter';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is incomplete.');
      return;
    }
    confirmSubscription(token).then(res => {
      setStatus(res.ok ? 'success' : 'error');
      setMessage(res.message);
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white">
            <Mail size={28} />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin mx-auto text-primary-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verifying your subscription...</h1>
            <p className="text-surface-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-accent-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2">You're confirmed!</h1>
            <p className="text-surface-500 mb-8">{message}</p>
            <Link to="/" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90">
              Visit Portfolio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
            <p className="text-surface-500 mb-8">{message}</p>
            <Link to="/" className="inline-block px-6 py-3 rounded-xl border border-surface-200 dark:border-surface-700 font-medium text-sm">
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
