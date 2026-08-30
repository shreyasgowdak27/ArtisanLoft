import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const toast = useToast();

  if (isAuthenticated) {
    navigate('/profile');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = register(formData);
    if (result.success) {
      toast.success('Account created successfully! Welcome to ArtisanLoft.');
      navigate('/profile');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-md bg-white p-10 border border-stone-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif mb-2">Create Account</h2>
          <p className="text-stone-400 text-sm">Join the ArtisanLoft family</p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Full Name *</label>
            <input 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Email Address *</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="rahul@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Phone Number</label>
            <input 
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Username *</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="rahul.sharma"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Password *</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Confirm Password *</label>
            <input 
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white font-semibold uppercase tracking-widest text-sm hover:bg-orange-600 transition-colors disabled:bg-orange-300"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="text-stone-900 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
