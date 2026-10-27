import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../api/api';
import { formatPrice } from '../utils/currency';
import {
  ShieldCheck,
  Truck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function Checkout() {
  const { cart, cartItems, cartCount, loading: cartLoading, error: cartError, clearCart, fetchCart, addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: user?.user_metadata?.full_name || '',
    shipping_line1: '',
    shipping_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    shipping_country: 'IN',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [processingPendingItem, setProcessingPendingItem] = useState(false);

  // Check and consume pending "Buy Now" item if coming from product detail
  useEffect(() => {
    const processPendingBuyNow = async () => {
      const pendingStr = sessionStorage.getItem('pending_buy_now');
      if (pendingStr) {
        try {
          setProcessingPendingItem(true);
          const { productId, quantity } = JSON.parse(pendingStr);
          sessionStorage.removeItem('pending_buy_now');
          if (productId) {
            await addToCart(productId, quantity || 1);
            await fetchCart();
          }
        } catch (err) {
          console.error('Error processing pending buy-now item:', err);
          sessionStorage.removeItem('pending_buy_now');
        } finally {
          setProcessingPendingItem(false);
        }
      }
    };

    processPendingBuyNow();
  }, [addToCart, fetchCart]);

  const validate = () => {
    const errors = {};
    if (!formData.shipping_name.trim()) {
      errors.shipping_name = 'Full name is required';
    }
    if (!formData.shipping_line1.trim()) {
      errors.shipping_line1 = 'Address line 1 is required';
    }
    if (!formData.shipping_city.trim()) {
      errors.shipping_city = 'City is required';
    }
    if (!formData.shipping_state.trim()) {
      errors.shipping_state = 'State is required';
    }

    const pincode = formData.shipping_pincode.trim();
    if (!pincode) {
      errors.shipping_pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode)) {
      errors.shipping_pincode = 'Pincode must be exactly 6 digits';
    }

    if (!formData.shipping_country.trim() || formData.shipping_country.trim().length !== 2) {
      errors.shipping_country = 'Valid 2-letter country code required (e.g. IN)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on edit
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    // Clear global submit error on change
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError('Cannot place order: your cart is empty');
      toast.error('Cannot place order: your cart is empty');
      return;
    }

    setSubmitting(true);

    const payload = {
      shipping_name: formData.shipping_name.trim(),
      shipping_line1: formData.shipping_line1.trim(),
      shipping_line2: formData.shipping_line2.trim() || null,
      shipping_city: formData.shipping_city.trim(),
      shipping_state: formData.shipping_state.trim(),
      shipping_pincode: formData.shipping_pincode.trim(),
      shipping_country: formData.shipping_country.trim().toUpperCase() || 'IN',
    };

    try {
      const res = await createOrder(payload);
      const createdOrder = res.data;

      // Immediately clear cart context and navbar count badge
      clearCart();

      toast.success('Order placed successfully!');
      // Navigate to order confirmation page with order data
      navigate(`/order-success/${createdOrder.id}`, { state: { order: createdOrder } });
    } catch (err) {
      console.error('Order creation failed:', err);
      // Extract exact backend error detail (e.g. 400 over-stock message)
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to place order. Please try again.';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0]?.msg) {
        errorMessage = detail[0].msg;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart?.subtotal_cents
    ? cart.subtotal_cents / 100
    : cartItems.reduce((sum, item) => {
        const price = item.product?.price_cents ? item.product.price_cents / 100 : item.product?.price || 0;
        return sum + price * item.quantity;
      }, 0);

  const deliveryCharge = 0; // Standard free delivery for furniture orders
  const total = subtotal + deliveryCharge;

  // Loading skeleton while cart or pending buy-now item is being loaded
  if (cartLoading || processingPendingItem) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-10 w-64 bg-stone-200 animate-pulse mb-8 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-stone-100 animate-pulse rounded-lg border border-stone-200"></div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-80 bg-stone-100 animate-pulse rounded-lg border border-stone-200"></div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (!cartLoading && cartItems.length === 0 && !processingPendingItem) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-stone-400" />
        </div>
        <h1 className="text-3xl font-serif mb-3">Your Cart is Empty</h1>
        <p className="text-stone-500 mb-8 max-w-md">
          You need items in your cart to proceed with checkout. Browse our handcrafted furniture collection to select your pieces.
        </p>
        <Link
          to="/collection"
          className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors rounded-sm"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb / Back Link */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-green-700" />
          <span>Secure Checkout</span>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-serif mb-8 pb-4 border-b border-stone-200">
        Checkout
      </h1>

      {/* Global backend error notification (e.g. 400 Insufficient stock) */}
      {submitError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to complete checkout</p>
            <p className="text-sm mt-0.5">{submitError}</p>
            {submitError.toLowerCase().includes('stock') && (
              <Link
                to="/cart"
                className="inline-block mt-2 text-xs font-semibold text-red-800 underline hover:text-red-900"
              >
                Return to Cart to adjust quantities &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      {cartError && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{cartError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate className="space-y-6 bg-white p-6 sm:p-8 border border-stone-200 rounded-lg">
            <div className="border-b border-stone-200 pb-4 mb-6">
              <h2 className="text-xl font-serif text-stone-900">Shipping Details</h2>
              <p className="text-xs text-stone-500 mt-1">
                Enter the delivery address where your handcrafted furniture will be safely shipped.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="shipping_name" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="shipping_name"
                name="shipping_name"
                type="text"
                disabled={submitting}
                value={formData.shipping_name}
                onChange={handleInputChange}
                placeholder="e.g. Priya Sharma"
                className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm ${
                  formErrors.shipping_name
                    ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                    : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                }`}
              />
              {formErrors.shipping_name && (
                <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_name}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label htmlFor="shipping_line1" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                Street Address <span className="text-red-600">*</span>
              </label>
              <input
                id="shipping_line1"
                name="shipping_line1"
                type="text"
                disabled={submitting}
                value={formData.shipping_line1}
                onChange={handleInputChange}
                placeholder="Flat / House No., Street, Landmark"
                className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm ${
                  formErrors.shipping_line1
                    ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                    : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                }`}
              />
              {formErrors.shipping_line1 && (
                <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_line1}</p>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label htmlFor="shipping_line2" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                Apartment, suite, unit (optional)
              </label>
              <input
                id="shipping_line2"
                name="shipping_line2"
                type="text"
                disabled={submitting}
                value={formData.shipping_line2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, unit, etc."
                className="w-full p-3.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white text-sm outline-none transition rounded-sm"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shipping_city" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  id="shipping_city"
                  name="shipping_city"
                  type="text"
                  disabled={submitting}
                  value={formData.shipping_city}
                  onChange={handleInputChange}
                  placeholder="e.g. Bengaluru"
                  className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm ${
                    formErrors.shipping_city
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                  }`}
                />
                {formErrors.shipping_city && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_city}</p>
                )}
              </div>

              <div>
                <label htmlFor="shipping_state" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                  State <span className="text-red-600">*</span>
                </label>
                <input
                  id="shipping_state"
                  name="shipping_state"
                  type="text"
                  disabled={submitting}
                  value={formData.shipping_state}
                  onChange={handleInputChange}
                  placeholder="e.g. Karnataka"
                  className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm ${
                    formErrors.shipping_state
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                  }`}
                />
                {formErrors.shipping_state && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_state}</p>
                )}
              </div>
            </div>

            {/* Pincode & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shipping_pincode" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                  6-Digit Pincode <span className="text-red-600">*</span>
                </label>
                <input
                  id="shipping_pincode"
                  name="shipping_pincode"
                  type="text"
                  maxLength={6}
                  disabled={submitting}
                  value={formData.shipping_pincode}
                  onChange={handleInputChange}
                  placeholder="560001"
                  className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm ${
                    formErrors.shipping_pincode
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                  }`}
                />
                {formErrors.shipping_pincode && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_pincode}</p>
                )}
              </div>

              <div>
                <label htmlFor="shipping_country" className="block text-xs uppercase tracking-wider font-semibold text-stone-700 mb-2">
                  Country Code <span className="text-red-600">*</span>
                </label>
                <input
                  id="shipping_country"
                  name="shipping_country"
                  type="text"
                  maxLength={2}
                  disabled={submitting}
                  value={formData.shipping_country}
                  onChange={handleInputChange}
                  className={`w-full p-3.5 bg-stone-50 border text-sm outline-none transition rounded-sm uppercase ${
                    formErrors.shipping_country
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-stone-200 focus:border-stone-900 focus:bg-white'
                  }`}
                />
                {formErrors.shipping_country && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.shipping_country}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0" />
                <span>Orders are backed by our 10-year craftsmanship guarantee and insured shipping.</span>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-1">
          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 sticky top-24">
            <h2 className="text-xl font-serif mb-4 pb-2 border-b border-stone-200">
              Order Summary ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </h2>

            {/* Item list */}
            <div className="max-h-72 overflow-y-auto space-y-3 mb-6 pr-1 divide-y divide-stone-100">
              {cartItems.map((item) => {
                const product = item.product || {};
                const unitPrice = product.price_cents ? product.price_cents / 100 : product.price || 0;
                const lineTotal = item.line_total_cents ? item.line_total_cents / 100 : unitPrice * item.quantity;
                const imageUrl = product.image_url || product.imageUrl || PLACEHOLDER_IMAGE;

                return (
                  <div key={item.product_id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <img
                      src={imageUrl}
                      alt={product.name || 'Product'}
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                      className="w-14 h-14 object-cover rounded border border-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {product.name || 'Handcrafted Item'}
                      </p>
                      <p className="text-xs text-stone-500">
                        Qty: {item.quantity} &times; {formatPrice(unitPrice)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                      {formatPrice(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations */}
            <div className="space-y-3 text-sm border-t border-b border-stone-200 py-4 mb-6">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="text-green-700 font-medium">FREE</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-lg font-serif text-stone-900">Total</span>
              <span className="text-2xl font-bold text-stone-900">{formatPrice(total)}</span>
            </div>

            {/* Place Order Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || cartItems.length === 0}
              className="w-full py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors rounded-sm shadow-sm flex items-center justify-center gap-2 disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Place Order</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mt-4">
              <Truck className="w-4 h-4 flex-shrink-0" />
              <span>Complimentary insured doorstep delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
