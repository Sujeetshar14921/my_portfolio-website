import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = isSignUp ? signUp : signIn;
    const { error: err } = await fn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-2">
            {isSignUp ? 'Create an admin account' : 'Sign in to manage your portfolio'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : <> {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full mt-3 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
