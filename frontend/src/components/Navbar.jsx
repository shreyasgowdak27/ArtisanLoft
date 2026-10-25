import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, X, Menu, LogOut } from 'lucide-react';
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

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
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
            aria-label="Toggle mobile menu"
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

          {/* Icons & Auth Section */}
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
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-stone-600 hover:text-stone-900"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* User / Auth Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-stone-700 hover:text-stone-900 text-sm"
                  aria-label="Account Menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.email || 'User'}
                      className="w-8 h-8 rounded-full border border-stone-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-stone-600" />
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-medium max-w-[140px] truncate">
                    {user?.email}
                  </span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-3 text-xs uppercase tracking-wider font-medium">
                  <Link
                    to="/login"
                    className="text-stone-700 hover:text-stone-900"
                  >
                    Login
                  </Link>
                  <span className="text-stone-300">|</span>
                  <Link
                    to="/signup"
                    className="text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Signup
                  </Link>
                </div>
              )}

              {/* Mobile icon when not logged in */}
              {!isAuthenticated && (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="sm:hidden text-stone-600 hover:text-stone-900"
                  aria-label="Account Menu"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 shadow-lg py-2 rounded-sm z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-stone-100">
                        {user?.name && (
                          <p className="font-medium text-sm text-stone-900 truncate">
                            {user.name}
                          </p>
                        )}
                        <p className="text-xs text-stone-500 truncate" title={user?.email}>
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium"
                      >
                        Signup
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative text-stone-600 hover:text-stone-900" aria-label="Cart">
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
            <div className="pt-2 border-t border-stone-100 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="py-2 px-1">
                    <p className="text-xs text-stone-400">Signed in as</p>
                    <p className="text-sm font-medium text-stone-800 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-stone-700 font-medium"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-red-600 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-stone-900 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-orange-600 font-medium"
                  >
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
