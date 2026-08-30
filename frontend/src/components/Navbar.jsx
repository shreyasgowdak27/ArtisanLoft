import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, X, Menu, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${searchQuery}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Collection', path: '/collection' },
    { name: 'About', path: '/about' },
    { name: 'Journal', path: '/journal' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white border-b border-stone-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-20 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-widest">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className="text-stone-600 hover:text-stone-900 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <svg width="40" height="40" viewBox="0 0 100 100" className="fill-stone-800">
              <path d="M20 80 L50 20 L80 80 H20 Z M45 40 H55 L50 30 Z" />
            </svg>
            <span className="text-2xl font-serif tracking-tighter">ArtisanLoft</span>
          </Link>

          {/* Icons */}
          <div className="flex items-center space-x-5">
            {/* Search */}
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search..." 
                  className="border-b border-stone-300 outline-none text-sm pb-1 w-32 md:w-48 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <X 
                  className="w-4 h-4 ml-2 cursor-pointer text-stone-400 hover:text-stone-900" 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
                />
              </form>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="text-stone-600 hover:text-stone-900">
                <Search className="w-5 h-5" />
              </button>
            )}
            
            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
              >
                {isAuthenticated ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 shadow-lg py-2">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-stone-500">{user.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        My Profile
                      </Link>
                      <Link 
                        to="/profile" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        Order History
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/signup" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative text-stone-600 hover:text-stone-900">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 py-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-stone-600 hover:text-stone-900 font-medium"
              >
                {link.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3 text-stone-900 font-medium"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3 text-orange-600 font-medium"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;