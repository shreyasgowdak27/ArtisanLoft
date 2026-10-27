import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();

  if (isAuthenticated) {
    navigate('/profile');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      setSuccess(true);
      if (toast?.success) {
        toast.success('Welcome back! Redirecting to your profile...');
      }
      setTimeout(() => navigate('/profile'), 1000);
    } else {
      setError(result.error || 'Failed to sign in. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-8">
      <div className="w-full max-w-md bg-white p-12 border border-stone-200">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif mb-2">Welcome Back</h2>
          <p className="text-stone-400 text-sm">Access your ArtisanLoft account</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-serif text-stone-800">Welcome back!</p>
            <p className="text-stone-500 text-sm mt-2">Redirecting to profile...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                Password
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors mt-4 disabled:bg-stone-400"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-stone-500 mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-orange-600 font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
