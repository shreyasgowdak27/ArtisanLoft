import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createOrder } from '../api/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/currency';
import { ChevronLeft, ChevronRight, ShieldCheck, Truck, RefreshCw, ShoppingBag, Check, MapPin, CreditCard, Banknote, Star, ZoomIn } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [ordering, setOrdering] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    getProductById(id)
      .then(res => {
        setProduct(res.data);
        setSelectedImageIndex(0);
      })
      .catch(err => console.error(err));
  }, [id]);

  const getAllImages = () => {
    if (!product) return [PLACEHOLDER_IMAGE];
    const mainImage = product.imageUrl || PLACEHOLDER_IMAGE;
    const additionalImages = product.imageUrls ? product.imageUrls.split(',').filter(url => url.trim()) : [];
    return [mainImage, ...additionalImages];
  };

  const images = product ? getAllImages() : [PLACEHOLDER_IMAGE];

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedToCart(true);
    toast.cart(`${product.name} added to cart`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleCheckPincode = () => {
    if (pincode.length === 6) {
      const deliverable = ['110001', '400001', '560001', '500001', '600001', '700001', '380001', '411001'].some(
        prefix => pincode.startsWith(prefix.slice(0, 3))
      );
      setDeliveryInfo({
        available: true,
        days: deliverable ? '3-5' : '7-10',
        cod: deliverable,
        free: product.price > 50000
      });
    }
  };

  const handleOrder = async () => {
    setOrdering(true);
    try {
      await createOrder({
        customerName: "Guest User",
        customerEmail: "guest@example.com",
        totalAmount: product.price * quantity
      });
      toast.success("Order placed successfully! You will receive a confirmation shortly.");
      navigate('/profile');
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  const emiPrice = Math.round(product?.price / 12);

  if (!product) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
    </div>
  );

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
              alt={`${product.name} - Image ${selectedImageIndex + 1}`} 
              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
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
                >
                  <img 
                    src={img} 
                    alt={`${product.name} thumbnail ${index + 1}`}
                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-2">{product.category}</span>
          <h1 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-stone-300'}`} />
              ))}
            </div>
            <span className="text-sm text-stone-500">(124 reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="text-3xl font-semibold text-stone-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-stone-500 mt-1">
              EMI from <span className="text-green-600 font-medium">{formatPrice(emiPrice)}/month</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">Inclusive of all taxes</p>
          </div>
          
          <div className="prose prose-stone mb-6">
            <p className="text-stone-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex border border-stone-300">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-stone-100"
              >-</button>
              <span className="px-4 py-2 border-x border-stone-300">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-stone-100"
              >+</button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button 
              onClick={handleAddToCart}
              disabled={addedToCart}
              className="flex-1 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors disabled:bg-green-700 flex items-center justify-center gap-2"
            >
              {addedToCart ? (
                <><Check className="w-4 h-4" /> Added</>
              ) : (
                <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
              )}
            </button>
            <button 
              onClick={handleOrder}
              disabled={ordering}
              className="flex-1 py-4 bg-orange-500 text-white font-semibold uppercase tracking-widest text-sm hover:bg-orange-600 transition-colors disabled:bg-orange-300"
            >
              {ordering ? 'Processing...' : 'Buy Now'}
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
