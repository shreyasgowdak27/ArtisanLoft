import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { User, Package, Heart, Settings, LogOut, Edit2, Check, X, MapPin, Phone } from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { cartItems } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', city: '' });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8">
        <User className="w-16 h-16 text-stone-300 mb-6" />
        <h2 className="text-2xl font-serif mb-4">Please Sign In</h2>
        <p className="text-stone-500 mb-8">Access your profile, orders, and wishlist</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '', city: user.city || '' });
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile(editForm);
    setEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleLogout = () => {
    logout();
    toast.info('You have been signed out');
    navigate('/');
  };

  const mockOrders = [
    { id: 'ART-2024-001', date: '15 Feb 2024', status: 'Delivered', total: 89999, items: 1, product: 'Sheesham 3-Seater Sofa' },
    { id: 'ART-2024-002', date: '10 Feb 2024', status: 'Shipped', total: 45999, items: 2, product: 'Makrana Marble Coffee Table' },
    { id: 'ART-2024-003', date: '28 Jan 2024', status: 'Delivered', total: 125999, items: 1, product: 'Teak Wood Dining Set' },
  ];

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
                src={user.avatar} 
                alt={user.name}
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <h2 className="text-xl font-serif mb-1">{user.name}</h2>
              <p className="text-stone-500 text-sm">{user.email}</p>
              <p className="text-stone-400 text-xs mt-2">Member since {user.joinDate}</p>
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
                <h1 className="text-3xl font-serif">My Profile</h1>
                {!editing && (
                  <button 
                    onClick={handleEdit}
                    className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              <div className="bg-white border border-stone-200 p-8">
                {editing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Full Name</label>
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">Email</label>
                      <input 
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white hover:bg-stone-800"
                      >
                        <Check className="w-4 h-4" /> Save Changes
                      </button>
                      <button 
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-2 px-6 py-3 border border-stone-300 hover:bg-stone-100"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Full Name</p>
                      <p className="text-lg">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Email</p>
                      <p className="text-lg">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Phone</p>
                      <p className="text-lg">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">City</p>
                      <p className="text-lg">{user.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Username</p>
                      <p className="text-lg">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Account Type</p>
                      <p className="text-lg">{user.role === 'ADMIN' ? 'Administrator' : 'Member'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="bg-stone-50 p-6 text-center">
                  <p className="text-3xl font-serif mb-1">{mockOrders.length}</p>
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
              <h1 className="text-3xl font-serif mb-8">Order History</h1>
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-stone-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-stone-500 text-sm">{order.date}</p>
                        <p className="text-stone-600 text-sm mt-1">{order.product}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs uppercase tracking-wider ${
                        order.status === 'Delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                      <p className="text-stone-500 text-sm">{order.items} item(s)</p>
                      <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button className="text-sm text-stone-600 hover:text-stone-900">Track Order</button>
                      <button className="text-sm text-stone-600 hover:text-stone-900">Download Invoice</button>
                      {order.status === 'Delivered' && (
                        <button className="text-sm text-orange-600 hover:text-orange-700">Write Review</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  <label className="flex items-center gap-3 cursor-pointer mt-3">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-stone-600">Receive promotional offers</span>
                  </label>
                </div>
                <div className="bg-white border border-stone-200 p-6">
                  <h3 className="font-medium mb-4">Privacy</h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" />
                    <span className="text-stone-600">Make my profile public</span>
                  </label>
                </div>
                <div className="bg-red-50 border border-red-200 p-6">
                  <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-red-600 text-sm mb-4">Once you delete your account, there is no going back.</p>
                  <button className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700">
                    Delete Account
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
