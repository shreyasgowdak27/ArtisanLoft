import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCartApi, updateCartItemApi, deleteCartItemApi } from '../api/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const INITIAL_CART = {
  items: [],
  item_count: 0,
  total_quantity: 0,
  subtotal_cents: 0,
  currency: 'INR',
};

const extractErrorMessage = (err, fallback = 'Operation failed') => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0 && detail[0]?.msg) {
    return detail[0].msg;
  }
  return err?.message || fallback;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(INITIAL_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(INITIAL_CART);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getCart();
      setCart(res.data || INITIAL_CART);
    } catch (err) {
      console.error('Failed to load cart:', err);
      // 401 just means session is unauthenticated/expired; don't set alarming error
      if (err?.response?.status === 401) {
        setCart(INITIAL_CART);
      } else {
        setError(extractErrorMessage(err, 'Failed to load cart items'));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [authLoading, fetchCart]);

  const addToCart = async (productOrId, quantity = 1) => {
    const productId = typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId;
    try {
      const res = await addToCartApi(productId, quantity);
      await fetchCart();
      return { success: true, data: res.data };
    } catch (err) {
      const message = extractErrorMessage(err, 'Failed to add item to cart');
      return { success: false, error: message };
    }
  };

  const updateQuantity = async (productOrId, quantity) => {
    const productId = typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId;
    try {
      if (quantity <= 0) {
        await deleteCartItemApi(productId);
      } else {
        await updateCartItemApi(productId, quantity);
      }
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = extractErrorMessage(err, 'Failed to update item quantity');
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (productOrId) => {
    const productId = typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId;
    try {
      await deleteCartItemApi(productId);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = extractErrorMessage(err, 'Failed to remove item from cart');
      return { success: false, error: message };
    }
  };

  const cartItems = cart?.items || [];
  const cartCount = cart?.total_quantity || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
