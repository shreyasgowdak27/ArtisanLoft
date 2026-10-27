import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, ShoppingBag, Heart, Loader2 } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function ProductCard({ item, onQuickView }) {
  const imageUrl = item.imageUrl || PLACEHOLDER_IMAGE;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isOutOfStock = item.stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (isOutOfStock) {
      toast.error('This item is currently out of stock');
      return;
    }

    setAdding(true);
    const result = await addToCart(item.id, 1);
    setAdding(false);

    if (result.success) {
      toast.cart(`${item.name} added to cart`);
    } else {
      toast.error(result.error || 'Failed to add to cart');
    }
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
    <Link to={`/product/${item.slug || item.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-4">
        <img
          src={imageUrl}
          alt={item.name}
          onError={(e) => {
            e.target.src = PLACEHOLDER_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
        />

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
              className={`flex-1 py-3 text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white disabled:opacity-75'
              }`}
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleQuickView}
              className="bg-white text-stone-900 p-3 hover:bg-stone-900 hover:text-white transition-colors"
              title="Quick View"
              aria-label={`Quick view ${item.name}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
            isWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-stone-600 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1">
              Out of Stock
            </span>
          ) : item.stock <= 5 ? (
            <span className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1">
              Only {item.stock} left
            </span>
          ) : null}

          {item.price > 100000 && !isOutOfStock && (
            <span className="bg-stone-900 text-white text-[10px] uppercase tracking-wider px-2 py-1">
              Premium
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-serif text-stone-800 group-hover:text-stone-600 transition-colors line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs uppercase tracking-widest text-stone-400">{item.category}</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-semibold text-stone-900">{formatPrice(item.price)}</span>
          <span className="text-xs text-green-600 font-medium">EMI Available</span>
        </div>
      </div>
    </Link>
  );
}
