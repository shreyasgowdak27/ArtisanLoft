import axios from 'axios';

const api = axios.create({
  baseURL: 'https://artisanloft-furniture.onrender.com/api',
});

export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const createOrder = (orderData) => api.post('/products/orders', orderData);

export default api;
