import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Thank you for subscribing! Welcome to the Artisan family.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-stone-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-serif mb-4">Join the Artisan Family</h3>
            <p className="text-stone-400 mb-8">
              Subscribe for exclusive access to new collections, artisan stories, and special offers. Get ₹500 off your first order!
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-stone-800 border border-stone-700 text-white placeholder-stone-500 outline-none focus:border-stone-500"
              />
              <button className="px-6 py-3 bg-orange-500 text-white font-semibold uppercase tracking-wider text-sm hover:bg-orange-600 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <svg width="32" height="32" viewBox="0 0 100 100" className="fill-white">
                <path d="M20 80 L50 20 L80 80 H20 Z M45 40 H55 L50 30 Z" />
              </svg>
              <span className="text-xl font-serif tracking-tighter">ArtisanLoft</span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              India's premium destination for handcrafted furniture. Every piece is made by skilled karigars using traditional techniques passed down through generations.
            </p>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            {/* Payment Methods */}
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">We Accept</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-stone-800 text-xs">Visa</span>
                <span className="px-2 py-1 bg-stone-800 text-xs">Mastercard</span>
                <span className="px-2 py-1 bg-stone-800 text-xs">UPI</span>
                <span className="px-2 py-1 bg-stone-800 text-xs">Net Banking</span>
                <span className="px-2 py-1 bg-stone-800 text-xs">COD</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/collection?category=Living Room" className="text-stone-400 hover:text-white transition-colors">Living Room</Link></li>
              <li><Link to="/collection?category=Dining" className="text-stone-400 hover:text-white transition-colors">Dining</Link></li>
              <li><Link to="/collection?category=Bedroom" className="text-stone-400 hover:text-white transition-colors">Bedroom</Link></li>
              <li><Link to="/collection?category=Office" className="text-stone-400 hover:text-white transition-colors">Office</Link></li>
              <li><Link to="/collection?category=Outdoor" className="text-stone-400 hover:text-white transition-colors">Outdoor</Link></li>
              <li><Link to="/collection?category=Lighting" className="text-stone-400 hover:text-white transition-colors">Lighting</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-stone-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/journal" className="text-stone-400 hover:text-white transition-colors">Journal</Link></li>
              <li><Link to="/contact" className="text-stone-400 hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="text-stone-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-stone-400 hover:text-white transition-colors">Store Locator</a></li>
              <li><a href="#" className="text-stone-400 hover:text-white transition-colors">Franchise</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-stone-400">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>42, MG Road, Bangalore<br />Karnataka 560001</span>
              </li>
              <li className="flex items-center gap-3 text-stone-400">
                <Phone className="w-5 h-5" />
                <span>+91 80 4567 8900</span>
              </li>
              <li className="flex items-center gap-3 text-stone-400">
                <Mail className="w-5 h-5" />
                <span>care@artisanloft.in</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-stone-800 rounded">
              <p className="text-xs text-stone-400">Customer Support</p>
              <p className="text-sm">Mon-Sat: 10AM - 7PM IST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-stone-500 text-sm text-center md:text-left">
              <p>© 2024 ArtisanLoft India Pvt. Ltd. All rights reserved.</p>
              <p className="text-xs mt-1">GSTIN: 29AABCU9603R1ZM | CIN: U52100KA2020PTC137890</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="#" className="text-stone-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors">Shipping Policy</a>
              <a href="#" className="text-stone-500 hover:text-white transition-colors">Return Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
