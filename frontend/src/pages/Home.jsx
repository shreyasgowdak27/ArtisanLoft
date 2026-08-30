import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/api';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Truck, ShieldCheck, Leaf, Award, CreditCard, IndianRupee } from 'lucide-react';

const CATEGORIES = [
  { name: 'Living Room', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600', count: 6 },
  { name: 'Dining', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600', count: 5 },
  { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693357370-58c35b54718b?auto=format&fit=crop&w=600', count: 6 },
  { name: 'Office', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600', count: 5 },
  { name: 'Outdoor', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600', count: 4 },
  { name: 'Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600', count: 4 },
];

const TESTIMONIALS = [
  { name: 'Priya Mehta', city: 'Mumbai', text: 'The Sheesham sofa set is absolutely stunning! The craftsmanship is incredible and delivery was on time.', rating: 5 },
  { name: 'Arjun Reddy', city: 'Hyderabad', text: 'Best furniture shopping experience. The team helped me design my entire living room.', rating: 5 },
  { name: 'Sneha Gupta', city: 'Delhi', text: 'EMI option made it easy to buy my dream dining table. Quality is premium.', rating: 4 },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts()
      .then(res => {
        setProducts(res.data);
        setFeaturedProducts(res.data.slice(0, 6));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-stone-100 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-stone-400 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-orange-600 mb-4">Handcrafted in India Since 1999</p>
              <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight text-stone-900">
                Where Art Meets<br/>
                <span className="italic text-stone-700">Craftsmanship</span>
              </h1>
              <p className="text-stone-600 text-lg mb-8 leading-relaxed">
                Discover India's finest handcrafted furniture made by master karigars using traditional techniques. Every piece tells a story of generations of craftsmanship.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link 
                  to="/collection"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white font-semibold uppercase tracking-widest text-sm hover:bg-orange-600 transition-colors"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/about"
                  className="inline-flex items-center gap-3 px-8 py-4 border-2 border-stone-900 text-stone-900 font-semibold uppercase tracking-widest text-sm hover:bg-stone-900 hover:text-white transition-colors"
                >
                  Our Story
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>COD Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Pan India Delivery</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <img 
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800" 
                alt="Featured furniture"
                className="w-full h-[450px] object-cover shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 shadow-lg">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Best Seller</p>
                <p className="font-serif text-lg">Sheesham Wood Sofa</p>
                <p className="text-orange-600 font-semibold">Starting ₹89,999</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-6 border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <Truck className="w-5 h-5 text-orange-500" />
              <span className="text-xs md:text-sm">Free Delivery Above ₹50K</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              <span className="text-xs md:text-sm">10-Year Warranty</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <Leaf className="w-5 h-5 text-orange-500" />
              <span className="text-xs md:text-sm">Made in India</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <span className="text-xs md:text-sm">No-Cost EMI</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <Award className="w-5 h-5 text-orange-500" />
              <span className="text-xs md:text-sm">50K+ Happy Homes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif mb-3 text-stone-900">Shop by Category</h2>
              <p className="text-stone-500">Find the perfect pieces for every room in your home</p>
            </div>
            <Link 
              to="/collection" 
              className="hidden md:flex items-center gap-2 text-stone-900 font-medium hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category) => (
              <Link 
                key={category.name}
                to={`/collection?category=${encodeURIComponent(category.name)}`}
                className="group relative aspect-[3/4] overflow-hidden bg-stone-100"
              >
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-serif text-lg">{category.name}</h3>
                  <p className="text-white/70 text-xs">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-stone-700 leading-relaxed">
            "Where there is craftsmanship, there is heritage."
          </blockquote>
          <cite className="block mt-6 text-sm uppercase tracking-widest text-stone-400 not-italic">
            — ArtisanLoft Philosophy
          </cite>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif mb-3 text-stone-900">Featured Pieces</h2>
              <p className="text-stone-500">Our most sought-after designs, handpicked for you</p>
            </div>
            <Link 
              to="/collection" 
              className="hidden md:flex items-center gap-2 text-stone-900 font-medium hover:gap-3 transition-all"
            >
              Shop All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-[40vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-stone-500 mb-4">Unable to load products at the moment.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-stone-900 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {featuredProducts.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12 md:hidden">
            <Link 
              to="/collection"
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">Happy Customers</h2>
            <p className="text-stone-500">Join 50,000+ happy homes across India</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-stone-50 p-8 border border-stone-200">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < testimonial.rating ? 'text-yellow-500' : 'text-stone-300'}`}>★</span>
                  ))}
                </div>
                <p className="text-stone-600 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-stone-500 text-sm">{testimonial.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif mb-4">The ArtisanLoft Promise</h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Every piece embodies our commitment to Indian craftsmanship, sustainability, and customer satisfaction.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-serif mb-3">Made in India</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                FSC-certified Indian hardwoods from Rajasthan, Kerala & Karnataka. Supporting local karigar communities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-serif mb-3">Master Karigars</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Handcrafted by 200+ skilled artisans with generations of expertise in traditional woodworking.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-serif mb-3">10-Year Warranty</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Comprehensive warranty with doorstep service. Your investment is protected for a decade.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-serif mb-3">Easy EMI</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                No-cost EMI available on all major banks. Buy now, pay later with 0% interest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-stone-100 p-12 md:p-20 text-center">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Ready to Transform Your Space?</h2>
            <p className="text-stone-600 text-lg mb-10 max-w-2xl mx-auto">
              Visit our showroom or browse our complete collection online. Our design consultants are here to help you find the perfect pieces.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/collection"
                className="px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors"
              >
                Browse Collection
              </Link>
              <Link 
                to="/contact"
                className="px-8 py-4 border-2 border-stone-900 text-stone-900 font-semibold uppercase tracking-widest text-sm hover:bg-stone-900 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
