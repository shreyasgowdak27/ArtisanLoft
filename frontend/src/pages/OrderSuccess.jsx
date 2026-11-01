import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getOrderById, payOrder } from '../api/api';
import { formatPrice } from '../utils/currency';
import {
  CheckCircle,
  Package,
  MapPin,
  Calendar,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order && Boolean(orderId));
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const receiptOrigin = location.state?.receiptOrigin || 'history';

  // Clear cart context and navbar count badge on mount
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // If order was not passed via state, fetch it by orderId
  useEffect(() => {
    if (!order && orderId) {
      setLoading(true);
      setError(null);
      getOrderById(orderId)
        .then((res) => {
          setOrder(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch order details:', err);
          const detail = err.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : 'Unable to find order details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [order, orderId]);

  const handleCopyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePayNow = async () => {
    if (!order?.id || paying) return;

    setPaying(true);
    setPaymentError(null);
    try {
      const response = await payOrder(order.id);
      setOrder(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPaymentError(
        typeof detail === 'string'
          ? detail
          : 'Unable to complete the demo payment. Please try again.'
      );
    } finally {
      setPaying(false);
    }
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-stone-200 animate-pulse rounded-full mx-auto"></div>
          <div className="h-8 w-64 bg-stone-200 animate-pulse mx-auto rounded"></div>
          <div className="h-4 w-96 bg-stone-100 animate-pulse mx-auto rounded"></div>
        </div>
        <div className="bg-white p-8 border border-stone-200 rounded-lg space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-stone-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-12 bg-stone-100 rounded"></div>
            <div className="h-12 bg-stone-100 rounded"></div>
          </div>
          <div className="h-20 bg-stone-50 rounded"></div>
        </div>
      </div>
    );
  }

  // State 2: Error
  if (error || (!order && !loading)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-serif mb-2">Order Not Found</h1>
        <p className="text-stone-500 mb-6 max-w-md">
          {error || "We couldn't retrieve the details for this order. It may have been placed under another account or does not exist."}
        </p>
        <div className="flex gap-4">
          <Link
            to="/profile"
            className="px-6 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition rounded-sm"
          >
            My Orders
          </Link>
          <Link
            to="/collection"
            className="px-6 py-3 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-widest hover:bg-stone-100 transition rounded-sm"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const totalRupees = order.total_cents ? order.total_cents / 100 : 0;
  const isPaid = order.status?.toLowerCase() === 'paid';
  const isCheckoutReceipt = receiptOrigin === 'checkout';
  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Banner */}
      <div className="text-center mb-12">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isPaid ? <CheckCircle className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
        </div>
        {isPaid ? (
          isCheckoutReceipt && (
            <span className="text-xs uppercase tracking-widest font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              Order Confirmed
            </span>
          )
        ) : (
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
            Payment Pending
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-serif mt-3 mb-2 text-stone-900">
          {isPaid && isCheckoutReceipt ? 'Thank you for your order!' : isPaid ? 'Order receipt' : 'Payment pending'}
        </h1>
        <p className="text-stone-500 max-w-md mx-auto text-sm">
          {isPaid
            ? 'Your order is confirmed. Our master artisans will prepare your handcrafted pieces with utmost care.'
            : 'Review the amount due, then use the demo payment to confirm your order.'}
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm divide-y divide-stone-200">
        {/* Order Details Header */}
        <div className="p-6 bg-stone-50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Order ID:</span>
              <span className="font-mono text-xs font-bold text-stone-800 break-all">{order.id}</span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="text-stone-400 hover:text-stone-700 transition p-1"
                title="Copy order ID"
                aria-label="Copy order ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Placed on {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase font-semibold px-2.5 py-1 rounded-full ${
              isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Status: {order.status}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-stone-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 mb-1">
                Shipping Address
              </h2>
              <p className="text-sm font-medium text-stone-800">{order.shipping_name}</p>
              <p className="text-sm text-stone-600">{order.shipping_line1}</p>
              {order.shipping_line2 && (
                <p className="text-sm text-stone-600">{order.shipping_line2}</p>
              )}
              <p className="text-sm text-stone-600">
                {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
              </p>
              <p className="text-xs text-stone-400 uppercase mt-0.5">{order.shipping_country}</p>
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-stone-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
              Ordered Items ({items.length})
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {items.map((item) => {
              const unitPrice = item.unit_price_cents ? item.unit_price_cents / 100 : 0;
              const lineTotal = item.line_total_cents ? item.line_total_cents / 100 : unitPrice * item.quantity;

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {item.product_name}
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
        </div>

        {/* Total Summary */}
        <div className="p-6 bg-stone-50">
          <div className="flex justify-between items-center text-sm mb-2 text-stone-600">
            <span>Delivery</span>
            <span className="text-green-700 font-medium">FREE</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
            <span className="text-base font-serif text-stone-900">{isPaid ? 'Total Paid' : 'Total Due'}</span>
            <span className="text-2xl font-bold text-stone-900">{formatPrice(totalRupees)}</span>
          </div>
        </div>
      </div>

      {!isPaid && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
          <p className="text-sm font-semibold text-amber-900">Demo payment, no real money is charged.</p>
          <p className="mt-1 text-sm text-amber-800">No card details are collected.</p>
          {paymentError && <p role="alert" className="mt-3 text-sm text-red-700">{paymentError}</p>}
          <button
            type="button"
            onClick={handlePayNow}
            disabled={paying}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 transition rounded-sm"
          >
            {paying && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{paying ? 'Processing payment' : 'Pay now'}</span>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/collection"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-xs hover:bg-stone-800 transition rounded-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-stone-300 text-stone-800 font-semibold uppercase tracking-widest text-xs hover:bg-stone-100 transition rounded-sm"
        >
          <span>View Account &amp; Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
