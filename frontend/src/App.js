import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar'; 
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';        
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Collection from './pages/Collection';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';

const Journal = () => (
  <div className="min-h-[60vh]">
    <section className="bg-stone-100 py-24">
      <div className="max-w-4xl mx-auto px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-6">Stories & Insights</p>
        <h1 className="text-5xl font-serif mb-6">The Artisan Journal</h1>
        <p className="text-stone-600 text-xl">Exploring the intersection of craft, wood, and modern living.</p>
      </div>
    </section>
    <section className="max-w-4xl mx-auto px-8 py-16">
      <div className="space-y-12">
        <article className="border-b border-stone-200 pb-12">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">February 2024 • Craftsmanship</p>
          <h2 className="text-2xl font-serif mb-4">The Anatomy of a Dining Table</h2>
          <p className="text-stone-600 mb-4">A deep dive into joinery techniques that have stood the test of time, from mortise and tenon to dovetail joints.</p>
          <span className="text-stone-900 font-medium">Coming Soon</span>
        </article>
        <article className="border-b border-stone-200 pb-12">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">January 2024 • Sustainability</p>
          <h2 className="text-2xl font-serif mb-4">Sourcing Responsibly: Our Wood Story</h2>
          <p className="text-stone-600 mb-4">How we partner with certified forests to ensure every piece of timber tells an ethical story.</p>
          <span className="text-stone-900 font-medium">Coming Soon</span>
        </article>
        <article className="pb-12">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">December 2023 • Design</p>
          <h2 className="text-2xl font-serif mb-4">Mid-Century Modern: A Timeless Revival</h2>
          <p className="text-stone-600 mb-4">Why the design principles of the 1950s continue to influence contemporary furniture making.</p>
          <span className="text-stone-900 font-medium">Coming Soon</span>
        </article>
      </div>
    </section>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;