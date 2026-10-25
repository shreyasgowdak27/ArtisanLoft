import axios from 'axios';
import { supabase } from '../lib/supabase';

// Base URL reads from the CRA env var so it works in both dev and production.
// In dev, set REACT_APP_API_URL=http://localhost:8000 in frontend/.env.local
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

// Attach Supabase access token as Bearer header on API calls
api.interceptors.request.use(async (config) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('Failed to attach Supabase session token to request:', err);
  }
  return config;
});

export const getProducts = () => api.get('/products');
export const getProductById = (slug) => api.get(`/products/${slug}`);
export const createOrder = (orderData) => api.post('/products/orders', orderData);
export const getMe = () => api.get('/me');

export default api;
