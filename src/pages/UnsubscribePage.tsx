import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, MailX } from 'lucide-react';
import { unsubscribe } from '@/lib/newsletter';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This unsubscribe link is incomplete.');
      return;
    }
    unsubscribe(token).then(res => {
      setStatus(res.ok ? 'success' : 'error');
      setMessage(res.message);
    });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500">
            <MailX size={28} />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin mx-auto text-primary-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Processing your request...</h1>
            <p className="text-surface-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-accent-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Unsubscribed</h1>
            <p className="text-surface-500 mb-8">{message}</p>
            <Link to="/" className="inline-block px-6 py-3 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90">
              Visit Portfolio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
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
