import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { getOrders } from '../api/api';
import OrderCard from '../components/OrderCard';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Unable to load your order history. Please verify your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-[70vh] bg-[#FAF7F3] py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500 font-semibold mb-2">
            Account &bull; Orders
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
              Order History
            </h1>
            {!loading && !error && orders.length > 0 && (
              <span className="text-sm text-stone-500">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
              </span>
            )}
          </div>
          <p className="text-stone-600 text-sm mt-2 max-w-xl">
            Review past purchases, monitor delivery status, and inspect detailed receipts for your handcrafted furniture.
          </p>
        </div>

        {/* State 1: Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white border border-stone-200 rounded-lg p-6 space-y-4 animate-pulse shadow-sm"
              >
                <div className="flex justify-between items-center pb-4 border-b border-stone-100">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-stone-200 rounded" />
                    <div className="h-3 w-32 bg-stone-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-stone-200 rounded-full" />
                </div>
                <div className="space-y-3 py-2">
                  <div className="h-4 w-3/4 bg-stone-100 rounded" />
                  <div className="h-4 w-1/2 bg-stone-100 rounded" />
                </div>
                <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                  <div className="h-4 w-28 bg-stone-100 rounded" />
                  <div className="h-4 w-24 bg-stone-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State 2: Error State */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">
              Failed to Load Orders
            </h2>
            <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-stone-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* State 3: Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-stone-900 mb-2">
              No orders placed yet
            </h2>
            <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto">
              When you purchase our handcrafted dining tables, chairs, and living room pieces, they will appear here.
            </p>
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-stone-800 transition shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Furniture Collection</span>
            </Link>
          </div>
        )}

        {/* State 4: List of Orders */}
        {!loading && !error && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

