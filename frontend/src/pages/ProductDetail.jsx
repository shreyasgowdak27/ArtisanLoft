import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getProductById } from '../api/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  ShoppingBag,
  Check,
  MapPin,
  CreditCard,
  Banknote,
  Star,
  ZoomIn,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setLoadingProduct(true);
    setProductError(null);
    getProductById(id)
      .then((res) => {
        setProduct(res.data);
        setSelectedImageIndex(0);
        setQuantity(1);
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        setProductError(err.response?.data?.detail || 'Failed to load product details.');
      })
      .finally(() => {
        setLoadingProduct(false);
      });
  }, [id]);

  const getAllImages = () => {
    if (!product) return [PLACEHOLDER_IMAGE];
    const mainImage = product.imageUrl || product.image_url || PLACEHOLDER_IMAGE;
    const additionalImages = product.imageUrls
      ? product.imageUrls.split(',').filter((url) => url.trim())
      : [];
    return [mainImage, ...additionalImages];
  };

  const images = product ? getAllImages() : [PLACEHOLDER_IMAGE];

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (product.stock === 0) {
      toast.error('This product is currently out of stock');
      return;
    }

    setAddingToCart(true);
    setCartError('');
    const result = await addToCart(product.id, quantity);
    setAddingToCart(false);

    if (result.success) {
      setAddedToCart(true);
      toast.cart(`${product.name} (${quantity}) added to cart`);
      setTimeout(() => setAddedToCart(false), 2000);
    } else {
      setCartError(result.error);
      toast.error(result.error || 'Failed to add to cart');
    }
  };

  const handleCheckPincode = () => {
    if (pincode.length === 6) {
      const deliverable = ['110001', '400001', '560001', '500001', '600001', '700001', '380001', '411001'].some(
        (prefix) => pincode.startsWith(prefix.slice(0, 3))
      );
      setDeliveryInfo({
        available: true,
        days: deliverable ? '3-5' : '7-10',
        cod: deliverable,
        free: product.price > 50000,
      });
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }

    if (!isAuthenticated) {
      // Store pending buy now item in sessionStorage so checkout loads it once logged in
      sessionStorage.setItem('pending_buy_now', JSON.stringify({ productId: product.id, quantity }));
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    setOrdering(true);
    setCartError('');
    const result = await addToCart(product.id, quantity);
    setOrdering(false);

    if (result.success) {
      navigate('/checkout');
    } else {
      setCartError(result.error);
      toast.error(result.error || 'Failed to add item for checkout');
    }
  };

  const emiPrice = product?.price ? Math.round(product.price / 12) : 0;
  const isOutOfStock = product?.stock === 0;

  if (loadingProduct) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="h-4 w-32 bg-stone-200 animate-pulse mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-stone-200 animate-pulse rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-stone-200 animate-pulse"></div>
            <div className="h-8 w-3/4 bg-stone-200 animate-pulse"></div>
            <div className="h-6 w-1/3 bg-stone-200 animate-pulse"></div>
            <div className="h-24 w-full bg-stone-100 animate-pulse"></div>
            <div className="h-12 w-full bg-stone-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-serif mb-2">Product Not Available</h2>
        <p className="text-stone-500 mb-6 max-w-md">
          {productError || 'We could not find the product you requested. It may have been removed or is temporarily unavailable.'}
        </p>
        <button
          onClick={() => navigate('/collection')}
          className="px-6 py-3 bg-stone-900 text-white font-medium uppercase tracking-wider text-xs hover:bg-stone-800 transition"
        >
          Return to Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-12 transition-colors uppercase text-xs font-bold tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-stone-100 aspect-square overflow-hidden group">
            <img
              src={images[selectedImageIndex]}
              alt={`${product.name} - View ${selectedImageIndex + 1}`}
              onError={(e) => {
                e.target.src = PLACEHOLDER_IMAGE;
              }}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Zoom indicator */}
            <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3 h-3" />
              Click to {isZoomed ? 'zoom out' : 'zoom in'}
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-xs">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-orange-500'
                      : 'border-transparent hover:border-stone-300'
                  }`}
                  aria-label={`Select view ${index + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-2">
            {product.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-stone-500">(124 reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <p className="text-3xl font-semibold text-stone-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-stone-500 mt-1">
              EMI from <span className="text-green-600 font-medium">{formatPrice(emiPrice)}/month</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">Inclusive of all taxes</p>
          </div>

          {/* Stock Status Indicator */}
          <div className="mb-6">
            {isOutOfStock ? (
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider rounded">
                Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded">
                Only {product.stock} left in stock — order soon
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                In Stock ({product.stock} units available)
              </span>
            )}
          </div>

          <div className="prose prose-stone mb-6">
            <p className="text-stone-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex border border-stone-300">
              <button
                type="button"
                onClick={() => {
                  setQuantity((prev) => Math.max(1, prev - 1));
                  setCartError('');
                }}
                disabled={quantity <= 1 || isOutOfStock}
                className="px-4 py-2 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="px-4 py-2 border-x border-stone-300 min-w-[40px] text-center font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuantity((prev) => Math.min(product.stock, prev + 1));
                  setCartError('');
                }}
                disabled={quantity >= product.stock || quantity >= 99 || isOutOfStock}
                className="px-4 py-2 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {product.stock > 0 && (
              <span className="text-xs text-stone-500">
                (Max: {product.stock})
              </span>
            )}
          </div>

          {/* Inline Action Error Message (e.g. 400 Over-Stock) */}
          {cartError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cartError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || addedToCart || isOutOfStock}
              className={`flex-1 py-4 font-semibold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : addedToCart
                  ? 'bg-green-700 text-white'
                  : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-75'
              }`}
            >
              {addingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : addedToCart ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={ordering || isOutOfStock}
              className={`flex-1 py-4 font-semibold uppercase tracking-widest text-sm transition-colors ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300'
              }`}
            >
              {ordering ? 'Adding to Cart...' : 'Buy Now'}
            </button>
          </div>

          {/* Pincode Checker */}
          <div className="bg-stone-50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium">Delivery Options</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 px-3 py-2 border border-stone-300 text-sm outline-none focus:border-stone-900"
              />
              <button
                onClick={handleCheckPincode}
                className="px-4 py-2 bg-stone-900 text-white text-sm hover:bg-stone-800"
              >
                Check
              </button>
            </div>
            {deliveryInfo && (
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-green-600">✓ Delivery available in {deliveryInfo.days} business days</p>
                {deliveryInfo.free && <p className="text-green-600">✓ Free delivery on this order</p>}
                {deliveryInfo.cod && <p className="text-stone-600">✓ Cash on Delivery available</p>}
              </div>
            )}
          </div>

          {/* Payment Options */}
          <div className="border border-stone-200 p-4 mb-6">
            <p className="text-sm font-medium mb-3">Payment Options</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Credit/Debit Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                <span>Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-600">UPI</span>
                <span>UPI Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">EMI</span>
                <span>No-Cost EMI</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200">
            <div className="flex flex-col items-center text-center">
              <Truck className="w-5 h-5 mb-2 text-stone-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Pan India Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 mb-2 text-stone-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">10-Year Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RefreshCw className="w-5 h-5 mb-2 text-stone-500" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
