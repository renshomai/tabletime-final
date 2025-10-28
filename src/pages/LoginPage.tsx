import { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { signIn } from '../lib/auth';

interface LoginPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'customer' | 'staff' | 'manager') => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white border-b border-[#f0e8d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 sm:h-16">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center justify-center space-x-2 hover:opacity-80 transition-opacity mb-3 sm:mb-0 sm:justify-start"
            >
              <Clock className="h-8 w-8 text-cyan" />
              <span className="text-2xl font-display text-[#111]">TableTime</span>
            </button>
            <div className="flex space-x-4 justify-center sm:justify-end">
              <span className="px-4 py-2 text-[#444] font-medium">Sign In</span>
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-2 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-all font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-12">
      <div className="w-full bg-white rounded-2xl p-8 shadow-sm border border-[#f0e8d8]">
        <h2 className="text-2xl font-display text-[#111] text-center mb-6">Welcome Back</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#222] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#ddd] rounded-xl text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#222] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#ddd] rounded-xl text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#666]">
            No account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-cyan hover:text-cyan-dark font-semibold transition-colors"
            >
              Sign-up
            </button>
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}
