import axios from 'axios';

// Base URL reads from the CRA env var so it works in both dev and production.
// In dev, set REACT_APP_API_URL=http://localhost:8000 in frontend/.env.local
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

export const getProducts = () => api.get('/products');
export const getProductById = (slug) => api.get(`/products/${slug}`);
export const createOrder = (orderData) => api.post('/products/orders', orderData);

export default api;
