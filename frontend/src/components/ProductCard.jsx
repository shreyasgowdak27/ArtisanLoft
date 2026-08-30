import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingBag, Heart } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function ProductCard({ item, onQuickView }) {
  const imageUrl = item.imageUrl || PLACEHOLDER_IMAGE;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();
  const toast = useToast();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item);
    toast.cart(`${item.name} added to cart`);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(item);
  };
  
  return (
    <Link to={`/product/${item.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
        <img 
          src={imageUrl} 
          alt={item.name} 
          onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out" 
        />
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-white text-stone-900 py-3 text-xs uppercase tracking-wider font-semibold hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
            <button 
              onClick={handleQuickView}
              className="bg-white text-stone-900 p-3 hover:bg-stone-900 hover:text-white transition-colors"
              title="Quick View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-stone-600 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Badge */}
        {item.price > 100000 && (
          <span className="absolute top-4 left-4 bg-stone-900 text-white text-[10px] uppercase tracking-wider px-2 py-1">
            Premium
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-lg font-serif text-stone-800 group-hover:text-stone-600 transition-colors line-clamp-1">{item.name}</h3>
        <p className="text-xs uppercase tracking-widest text-stone-400">{item.category}</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-semibold text-stone-900">{formatPrice(item.price)}</span>
          <span className="text-xs text-green-600 font-medium">EMI Available</span>
        </div>
      </div>
    </Link>
  );
}
