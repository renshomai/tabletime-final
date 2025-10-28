import { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { signUp } from '../lib/auth';

interface RegisterPageProps {
  onNavigate: (page: 'landing' | 'login' | 'register' | 'customer' | 'staff' | 'manager') => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // Optional field

    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length !== 11) {
      return 'Phone number must be exactly 11 digits';
    }

    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must include at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must include at least one number';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must include at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      // Clean phone number before submitting (remove non-digits)
      const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';
      await signUp(email, password, fullName, cleanedPhone, 'customer');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#f0e8d8] text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-cyan" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display text-[#111] mb-2">Account Created!</h2>
          <p className="text-sm sm:text-base text-[#444] mb-5 sm:mb-6">
            You're all set. Your account has been created successfully.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-2.5 sm:py-3 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-colors text-sm sm:text-base font-semibold"
          >
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

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
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-[#444] hover:text-[#111] transition-colors font-medium"
              >
                Sign In
              </button>
              <span className="px-6 py-2 bg-cyan text-white rounded-xl font-medium">
                Sign Up
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-6 sm:py-12">
      <div className="w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#f0e8d8]">
        <h2 className="text-xl sm:text-2xl font-display text-[#111] text-center mb-4 sm:mb-6">Create Account</h2>

        {error && (
          <div className="mb-3 sm:mb-4 bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-[#222] mb-1.5 sm:mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#ddd] rounded-xl text-sm sm:text-base text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-[#222] mb-1.5 sm:mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#ddd] rounded-xl text-sm sm:text-base text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-[#222] mb-1.5 sm:mb-2">
              Phone Number <span className="text-[#999] font-normal">(Optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#ddd] rounded-xl text-sm sm:text-base text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="09123456789"
              maxLength={11}
            />
            {phoneFocused && (
              <p className="mt-1.5 sm:mt-2 text-xs text-[#666] leading-tight">
                Must be exactly 11 digits.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-[#222] mb-1.5 sm:mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#ddd] rounded-xl text-sm sm:text-base text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Enter password"
            />
            {passwordFocused && (
              <p className="mt-1.5 sm:mt-2 text-xs text-[#666] leading-tight">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs sm:text-sm font-medium text-[#222] mb-1.5 sm:mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[#ddd] rounded-xl text-sm sm:text-base text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-transparent"
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 bg-cyan text-white rounded-xl hover:bg-cyan-dark transition-colors text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-[#666]">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-cyan hover:text-cyan-dark font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
      </main>
    </div>
  );
}
