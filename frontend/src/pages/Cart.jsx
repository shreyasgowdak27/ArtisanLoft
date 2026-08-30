import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { Trash2, ShoppingBag, Minus, Plus, Tag, Truck } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function Cart() {
  const { cartItems, removeFromCart, addToCart } = useCart();
  const toast = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon ? Math.round(subtotal * 0.1) : 0;
  const deliveryCharge = subtotal > 50000 ? 0 : 999;
  const total = subtotal - discount + deliveryCharge;
  const savings = discount + (deliveryCharge === 0 ? 999 : 0);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'ARTISAN10') {
      setAppliedCoupon('ARTISAN10');
      toast.success('Coupon applied! 10% discount added');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleQuantityChange = (item, delta) => {
    if (delta > 0) {
      addToCart(item);
    } else if (item.quantity > 1) {
      addToCart({ ...item, quantity: -1 });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8">
        <ShoppingBag className="w-16 h-16 text-stone-300 mb-6" />
        <h2 className="text-2xl font-serif mb-4">Your cart is empty</h2>
        <p className="text-stone-500 mb-8">Discover our curated collection of artisan furniture</p>
        <Link 
          to="/collection" 
          className="px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-serif mb-8">Shopping Cart ({cartItems.length} items)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-6 p-6 bg-white border border-stone-200">
              <Link to={`/product/${item.id}`} className="w-28 h-28 bg-stone-100 flex-shrink-0">
                <img 
                  src={item.imageUrl || PLACEHOLDER_IMAGE} 
                  alt={item.name}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="flex-grow">
                <Link to={`/product/${item.id}`} className="text-lg font-serif hover:text-stone-600">{item.name}</Link>
                <p className="text-stone-500 text-xs uppercase tracking-wider mt-1">{item.category}</p>
                <p className="text-lg font-semibold mt-2">{formatPrice(item.price)}</p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-stone-300">
                    <button 
                      onClick={() => handleQuantityChange(item, -1)}
                      className="p-2 hover:bg-stone-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-1 text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item, 1)}
                      className="p-2 hover:bg-stone-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => { removeFromCart(item.id); toast.info('Item removed from cart'); }}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 p-6 sticky top-24">
            <h2 className="text-xl font-serif mb-6">Order Summary</h2>
            
            {/* Coupon */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input 
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-stone-300 text-sm outline-none focus:border-stone-900"
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-green-600 text-sm mt-2">✓ {appliedCoupon} applied</p>
              )}
              <p className="text-xs text-stone-500 mt-2">Try: ARTISAN10 for 10% off</p>
            </div>

            <div className="space-y-3 text-sm border-b border-stone-200 pb-6 mb-6">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-green-600' : ''}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-serif">Total</span>
              <span className="text-2xl font-semibold">{formatPrice(total)}</span>
            </div>
            
            {savings > 0 && (
              <p className="text-green-600 text-sm mb-6">You're saving {formatPrice(savings)} on this order!</p>
            )}

            <button className="w-full py-4 bg-orange-500 text-white font-semibold uppercase tracking-widest text-sm hover:bg-orange-600 transition-colors mb-3">
              Proceed to Checkout
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
              <Truck className="w-4 h-4" />
              <span>Free delivery on orders above ₹50,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
