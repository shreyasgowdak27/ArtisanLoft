import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import {
  Trash2,
  ShoppingBag,
  Minus,
  Plus,
  Tag,
  Truck,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  ArrowRight,
} from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function Cart() {
  const { cart, cartItems, cartCount, loading, error, fetchCart, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [updatingId, setUpdatingId] = useState(null);
  const [itemErrors, setItemErrors] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = cart?.subtotal_cents
    ? cart.subtotal_cents / 100
    : cartItems.reduce((sum, item) => {
        const price = item.product?.price_cents ? item.product.price_cents / 100 : item.product?.price || 0;
        return sum + price * item.quantity;
      }, 0);

  const discount = appliedCoupon ? Math.round(subtotal * 0.1) : 0;
  const deliveryCharge = subtotal > 50000 || subtotal === 0 ? 0 : 999;
  const total = Math.max(0, subtotal - discount + deliveryCharge);
  const savings = discount + (deliveryCharge === 0 && subtotal > 0 ? 999 : 0);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'ARTISAN10') {
      setAppliedCoupon('ARTISAN10');
      toast.success('Coupon applied: 10% discount added');
    } else {
      toast.error('Invalid coupon code. Try ARTISAN10');
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    setUpdatingId(productId);
    setItemErrors((prev) => ({ ...prev, [productId]: null }));
    const result = await updateQuantity(productId, newQuantity);
    setUpdatingId(null);
    if (!result.success) {
      setItemErrors((prev) => ({ ...prev, [productId]: result.error }));
      toast.error(result.error);
    }
  };

  const handleRemoveItem = async (productId, productName) => {
    setUpdatingId(productId);
    setItemErrors((prev) => ({ ...prev, [productId]: null }));
    const result = await removeFromCart(productId);
    setUpdatingId(null);
    if (result.success) {
      toast.info(productName ? `${productName} removed from cart` : 'Item removed from cart');
    } else {
      setItemErrors((prev) => ({ ...prev, [productId]: result.error }));
      toast.error(result.error);
    }
  };

  // State 1: Authenticating or initial loading
  if (authLoading || (loading && cartItems.length === 0 && !error)) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="h-10 w-64 bg-stone-200 animate-pulse mb-8 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-6 p-6 bg-white border border-stone-200 animate-pulse rounded-lg">
                <div className="w-28 h-28 bg-stone-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 w-3/4 bg-stone-200 rounded"></div>
                  <div className="h-4 w-1/4 bg-stone-200 rounded"></div>
                  <div className="h-6 w-1/3 bg-stone-200 rounded"></div>
                  <div className="h-8 w-28 bg-stone-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-stone-200 rounded"></div>
              <div className="h-10 w-full bg-stone-200 rounded"></div>
              <div className="space-y-2 pt-4 border-t border-stone-200">
                <div className="h-4 w-full bg-stone-200 rounded"></div>
                <div className="h-4 w-full bg-stone-200 rounded"></div>
                <div className="h-8 w-full bg-stone-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Logged out
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-stone-600" />
        </div>
        <h2 className="text-3xl font-serif mb-3">Sign In to View Your Cart</h2>
        <p className="text-stone-500 mb-8 max-w-md">
          Your shopping bag is saved to your account. Sign in with your ArtisanLoft credentials to access your cart and proceed to checkout.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            className="px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors rounded-sm"
          >
            Sign In Now
          </button>
          <Link
            to="/collection"
            className="px-8 py-4 border border-stone-300 text-stone-700 font-semibold uppercase tracking-widest text-xs hover:bg-stone-100 transition-colors rounded-sm"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Error loading cart
  if (error && cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-serif mb-2">Unable to Load Your Cart</h2>
        <p className="text-stone-500 mb-6 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={fetchCart}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            to="/collection"
            className="px-6 py-3 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-widest hover:bg-stone-100 transition"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-stone-400" />
        </div>
        <h2 className="text-3xl font-serif mb-3">Your Cart is Empty</h2>
        <p className="text-stone-500 mb-8 max-w-md">
          Looks like you haven't added anything yet. Explore our handcrafted furniture collection to find timeless pieces for your home.
        </p>
        <Link
          to="/collection"
          className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors rounded-sm"
        >
          Explore Collection <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // State 5: Active cart with items
  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <h1 className="text-3xl md:text-4xl font-serif">
          Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={fetchCart}
          disabled={loading}
          className="text-stone-500 hover:text-stone-900 text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          title="Refresh cart"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => {
            const product = item.product || {};
            const productId = item.product_id;
            const isUpdating = updatingId === productId;
            const itemError = itemErrors[productId];
            const unitPrice = product.price_cents ? product.price_cents / 100 : product.price || 0;
            const lineTotal = item.line_total_cents ? item.line_total_cents / 100 : unitPrice * item.quantity;
            const imageUrl = product.image_url || product.imageUrl || PLACEHOLDER_IMAGE;
            const isAtMaxStock = product.stock > 0 && item.quantity >= product.stock;

            return (
              <div
                key={productId}
                className={`p-6 bg-white border transition-colors rounded-lg ${
                  itemError ? 'border-red-300 bg-red-50/20' : 'border-stone-200'
                }`}
              >
                <div className="flex gap-6">
                  <Link
                    to={`/product/${product.slug || productId}`}
                    className="w-28 h-28 bg-stone-100 flex-shrink-0 overflow-hidden rounded border border-stone-100"
                  >
                    <img
                      src={imageUrl}
                      alt={product.name || 'Product'}
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <Link
                          to={`/product/${product.slug || productId}`}
                          className="text-lg font-serif hover:text-stone-600 transition"
                        >
                          {product.name || 'Handcrafted Item'}
                        </Link>
                        <p className="text-lg font-semibold text-stone-900 whitespace-nowrap">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span>Unit: {formatPrice(unitPrice)}</span>
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                            Only {product.stock} left in stock
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-stone-300 rounded bg-white">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                            disabled={isUpdating}
                            className="p-2 hover:bg-stone-100 text-stone-700 disabled:opacity-40 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 py-1 text-sm font-medium min-w-[36px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                            disabled={isUpdating || isAtMaxStock || item.quantity >= 99}
                            className="p-2 hover:bg-stone-100 text-stone-700 disabled:opacity-40 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isUpdating && (
                          <span className="flex items-center gap-1.5 text-xs text-stone-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(productId, product.name)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1.5 p-1 transition disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Over-Stock or Error Notification */}
                {itemError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{itemError}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 sticky top-24">
            <h2 className="text-xl font-serif mb-6 pb-2 border-b border-stone-200">Order Summary</h2>

            {/* Coupon Code Input */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 text-sm outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition rounded-sm"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-green-700 text-xs mt-2 font-medium">✓ {appliedCoupon} applied (10% off)</p>
              )}
              <p className="text-[11px] text-stone-400 mt-1">Try: ARTISAN10 for 10% discount</p>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 text-sm border-b border-stone-200 pb-6 mb-6">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-green-700 font-medium' : 'text-stone-900'}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-lg font-serif">Total</span>
              <span className="text-2xl font-bold text-stone-900">{formatPrice(total)}</span>
            </div>

            {savings > 0 && (
              <p className="text-green-700 text-xs mb-6 font-medium">
                You save {formatPrice(savings)} on this order!
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                toast.info('Checkout flow will be available in Phase 5!');
              }}
              className="w-full py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors mb-3 rounded-sm shadow-sm"
            >
              Proceed to Checkout
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-2">
              <Truck className="w-4 h-4 flex-shrink-0" />
              <span>Free delivery on orders above ₹50,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
