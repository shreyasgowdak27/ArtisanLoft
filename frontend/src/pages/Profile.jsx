import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getMe, getOrders } from '../api/api';
import OrderCard from '../components/OrderCard';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, loading, logout, updateProfile } = useAuth();
  const { cartItems } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '' });

  const [backendUser, setBackendUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [errorMe, setErrorMe] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);

  const fetchUserProfile = async () => {
    setLoadingMe(true);
    setErrorMe(null);
    try {
      const response = await getMe();
      setBackendUser(response.data);
    } catch (err) {
      console.error('Failed to fetch /me from backend:', err);
      setErrorMe('Unable to sync profile with backend server.');
    } finally {
      setLoadingMe(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      const response = await getOrders();
      setOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders in profile:', err);
      const detail = err.response?.data?.detail;
      setErrorOrders(
        typeof detail === 'string'
          ? detail
          : 'Unable to load your orders. Please try again.'
      );
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleEdit = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const res = await updateProfile({
      name: editForm.name,
      full_name: editForm.name,
      phone: editForm.phone,
      city: editForm.city,
    });
    if (res.success) {
      setEditing(false);
      if (toast?.success) {
        toast.success('Profile updated successfully');
      }
    } else {
      if (toast?.error) {
        toast.error(res.error || 'Failed to update profile');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    if (toast?.info) {
      toast.info('You have been signed out');
    }
    navigate('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 p-6 mb-6">
            <div className="text-center">
              <img
                src={user?.avatar}
                alt={user?.name || 'User'}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border border-stone-200"
              />
              <h2 className="text-xl font-serif mb-1">{user?.name}</h2>
              <p className="text-stone-500 text-sm truncate" title={user?.email}>
                {user?.email}
              </p>
              <p className="text-stone-400 text-xs mt-2">Member since {user?.joinDate}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-stone-900 text-white'
                    : 'hover:bg-stone-100 text-stone-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-serif">My Profile</h1>
                  <p className="text-xs text-stone-400 mt-1">Verified with Supabase Auth & FastAPI</p>
                </div>
                {!editing && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchUserProfile}
                      disabled={loadingMe}
                      title="Sync with backend"
                      className="p-2 text-stone-500 hover:text-stone-800 disabled:opacity-50"
                      aria-label="Refresh Profile"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingMe ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </div>
                )}
              </div>

              {errorMe && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{errorMe}</span>
                  </div>
                  <button
                    onClick={fetchUserProfile}
                    className="text-xs underline hover:no-underline font-medium ml-4"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="bg-white border border-stone-200 p-8">
                {editing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900"
                        placeholder="Bangalore"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 font-medium text-sm"
                      >
                        <Check className="w-4 h-4" /> Save Changes
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-2 px-6 py-3 border border-stone-300 hover:bg-stone-100 font-medium text-sm"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Full Name</p>
                      <p className="text-lg text-stone-900">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Email (Supabase)</p>
                      <p className="text-lg text-stone-900 truncate" title={user?.email}>
                        {backendUser?.email || user?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">User ID (Backend Verified)</p>
                      <p className="text-sm font-mono bg-stone-50 p-2 rounded border border-stone-100 text-stone-700 truncate" title={backendUser?.id || user?.id}>
                        {backendUser?.id || user?.id || 'Pending sync...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Phone</p>
                      <p className="text-lg text-stone-900">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">City</p>
                      <p className="text-lg text-stone-900">{user?.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Account Role</p>
                      <p className="text-lg text-stone-900 capitalize">{user?.role || 'Customer'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="bg-stone-50 p-6 text-center">
                  <p className="text-3xl font-serif mb-1">{orders.length}</p>
                  <p className="text-stone-500 text-sm">Total Orders</p>
                </div>
                <div className="bg-stone-50 p-6 text-center">
                  <p className="text-3xl font-serif mb-1">{cartItems.length}</p>
                  <p className="text-stone-500 text-sm">Cart Items</p>
                </div>
                <div className="bg-stone-50 p-6 text-center">
                  <p className="text-3xl font-serif mb-1">0</p>
                  <p className="text-stone-500 text-sm">Wishlist</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif">Order History</h1>
                {!loadingOrders && !errorOrders && orders.length > 0 && (
                  <span className="text-sm text-stone-500">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
                  </span>
                )}
              </div>

              {loadingOrders && (
                <div className="space-y-4">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 animate-pulse"
                    >
                      <div className="h-4 w-48 bg-stone-200 rounded" />
                      <div className="h-4 w-3/4 bg-stone-100 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!loadingOrders && errorOrders && (
                <div className="bg-white border border-red-200 rounded-lg p-8 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-stone-900 mb-1">
                    Failed to Load Orders
                  </h2>
                  <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto">
                    {errorOrders}
                  </p>
                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-stone-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}

              {!loadingOrders && !errorOrders && orders.length === 0 && (
                <div className="bg-white border border-stone-200 rounded-lg p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
                    <Package className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-serif text-stone-900 mb-2">
                    No orders placed yet
                  </h2>
                  <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
                    When you purchase our handcrafted dining tables, chairs, and living room pieces, they will appear here.
                  </p>
                  <Link
                    to="/collection"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse Furniture Collection</span>
                  </Link>
                </div>
              )}

              {!loadingOrders && !errorOrders && orders.length > 0 && (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <h1 className="text-3xl font-serif mb-8">My Wishlist</h1>
              <div className="text-center py-16 bg-stone-50">
                <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 mb-4">Your wishlist is empty</p>
                <button
                  onClick={() => navigate('/')}
                  className="text-stone-900 underline hover:no-underline"
                >
                  Browse Collection
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h1 className="text-3xl font-serif mb-8">Account Settings</h1>
              <div className="space-y-6">
                <div className="bg-white border border-stone-200 p-6">
                  <h3 className="font-medium mb-4">Email Notifications</h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-stone-600">Receive order updates via email</span>
                  </label>
                </div>
                <div className="bg-red-50 border border-red-200 p-6">
                  <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-red-600 text-sm mb-4">Sign out of your active Supabase session.</p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
