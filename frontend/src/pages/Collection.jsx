import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/api';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/currency';
import { SlidersHorizontal, Grid, List, X } from 'lucide-react';

const CATEGORIES = ['All', 'Living Room', 'Dining', 'Bedroom', 'Office', 'Outdoor', 'Lighting'];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
];

const PRICE_RANGES = [
  { label: 'Under ₹25,000', min: 0, max: 25000 },
  { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
  { label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 },
  { label: 'Above ₹1,00,000', min: 100000, max: 500000 },
];

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    if (category) {
      setSelectedCategory(category);
    }

    getProducts()
      .then(res => {
        let data = res.data;
        if (search) {
          data = data.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
          );
        }
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products", err);
        setLoading(false);
      });
  }, [searchParams]);

  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, sortBy, priceRange]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, 500000]);
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Our Collection</h1>
        <p className="text-stone-500 max-w-2xl">
          Discover handcrafted furniture made by master karigars across India. Each piece represents generations of traditional craftsmanship combined with contemporary design.
        </p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">✓ Free Delivery on orders above ₹50,000</span>
          <span className="flex items-center gap-1">✓ No-Cost EMI Available</span>
          <span className="flex items-center gap-1">✓ 10-Year Warranty</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-stone-200">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-4 py-2 text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-stone-300 hover:border-stone-900 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>
          <p className="text-stone-500 text-sm">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-stone-300 bg-white text-sm outline-none focus:border-stone-900"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-stone-50 p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium">Filters</h3>
            <button 
              onClick={clearFilters}
              className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-4">Price Range</h4>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => setPriceRange([range.min, range.max])}
                    className={`px-3 py-2 text-sm border transition-colors ${
                      priceRange[0] === range.min && priceRange[1] === range.max
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-stone-300 hover:border-stone-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-4">Custom Range</h4>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">₹</span>
                  <input 
                    type="number" 
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-32 pl-7 pr-3 py-2 border border-stone-300 text-sm outline-none focus:border-stone-900"
                    placeholder="Min"
                  />
                </div>
                <span className="text-stone-400">to</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">₹</span>
                  <input 
                    type="number" 
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-32 pl-7 pr-3 py-2 border border-stone-300 text-sm outline-none focus:border-stone-900"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-500 mb-4">No products found matching your criteria.</p>
          <button 
            onClick={clearFilters}
            className="text-stone-900 underline hover:no-underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredProducts.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
