import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [username, setUsername] = useState('');
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
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    const result = login(username, password);
    if (result.success) {
      setSuccess(true);
      toast.success('Welcome back! Redirecting to your profile...');
      setTimeout(() => navigate('/profile'), 1500);
    } else {
      setError(result.error);
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
            <p className="text-stone-500 text-sm mt-2">Redirecting to home...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                placeholder="••••••••"
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

            <div className="text-center pt-6 border-t border-stone-200 mt-6">
              <p className="text-xs text-stone-400 mb-2">Demo Accounts:</p>
              <div className="text-xs text-stone-500 space-y-1">
                <p><span className="font-medium">rahul.sharma</span> / rahul123</p>
                <p><span className="font-medium">priya.patel</span> / priya123</p>
                <p><span className="font-medium">admin</span> / admin123</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
