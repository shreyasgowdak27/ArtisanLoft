import axios from 'axios';
import { supabase } from '../lib/supabase';

// Base URL reads from the CRA env var so it works in both dev and production.
// In dev, set REACT_APP_API_URL=http://localhost:8000 in frontend/.env.local
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

// Attach Supabase access token as Bearer header on API calls.
// Race getSession() against a 2-second timeout so a slow or hung auth
// check never blocks a public endpoint (e.g. /products) indefinitely.
api.interceptors.request.use(async (config) => {
  try {
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000, null));
    const result = await Promise.race([supabase.auth.getSession(), timeout]);
    const session = result?.data?.session;
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Non-fatal: proceed without auth header
    console.error('Failed to attach Supabase session token to request:', err);
  }
  return config;
});

export const getProducts = () => api.get('/products');
export const getProductById = (slug) => api.get(`/products/${slug}`);
export const createOrder = (orderData) => api.post('/products/orders', orderData);
export const getMe = () => api.get('/me');
export const getCart = () => api.get('/cart');
export const addToCartApi = (productId, quantity = 1) =>
  api.post('/cart/items', { product_id: productId, quantity });
export const updateCartItemApi = (productId, quantity) =>
  api.patch(`/cart/items/${productId}`, { quantity });
export const deleteCartItemApi = (productId) =>
  api.delete(`/cart/items/${productId}`);

export default api;
