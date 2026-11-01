import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-50 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-800 border-red-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-800 border-red-200',
  },
};

export default function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const items = order.items || [];
  const totalRupees = order.total_cents ? order.total_cents / 100 : 0;
  const statusInfo = STATUS_CONFIG[order.status?.toLowerCase()] || {
    label: order.status || 'Unknown',
    className: 'bg-stone-50 text-stone-800 border-stone-200',
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const handleCopyOrderId = (e) => {
    e.stopPropagation();
    if (order.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalItemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:border-stone-300 transition-colors">
      {/* Card Header */}
      <div className="p-5 md:p-6 bg-stone-50/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Order ID:
            </span>
            <span className="font-mono text-xs font-bold text-stone-800" title={order.id}>
              {order.id}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="text-stone-400 hover:text-stone-700 transition p-1"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Placed on {formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`text-xs uppercase font-semibold px-2.5 py-1 rounded-full border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
          <div className="text-right">
            <p className="text-xs text-stone-500">Total</p>
            <p className="text-lg font-bold text-stone-900">{formatPrice(totalRupees)}</p>
          </div>
        </div>
      </div>

      {/* Card Body: Items Overview */}
      <div className="p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <Package className="w-4 h-4 text-stone-500" />
            Items ({totalItemCount})
          </span>
          {items.length > 2 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-stone-700 hover:text-stone-900 flex items-center gap-1 normal-case font-medium tracking-normal text-xs"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  View All {items.length} Items <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Item Rows */}
        <div className="divide-y divide-stone-100">
          {(expanded ? items : items.slice(0, 2)).map((item) => {
            const unitPrice = item.unit_price_cents ? item.unit_price_cents / 100 : 0;
            const lineTotal = item.line_total_cents
              ? item.line_total_cents / 100
              : unitPrice * (item.quantity || 1);

            return (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
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

        {/* Shipping address teaser */}
        {order.shipping_city && (
          <div className="pt-3 border-t border-stone-100 flex items-start gap-2 text-xs text-stone-500">
            <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
            <span className="truncate">
              Deliver to: <strong className="font-medium text-stone-700">{order.shipping_name}</strong> &mdash;{' '}
              {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3 md:px-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between gap-4">
        <span className="text-xs text-stone-400">
          Handcrafted furniture order
        </span>
        <Link
          to={`/order-success/${order.id}`}
          state={{ order }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 hover:underline transition"
        >
          <span>View Details &amp; Receipt</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

