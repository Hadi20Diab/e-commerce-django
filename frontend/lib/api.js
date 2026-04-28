import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          const newAccess = res.data.access;
          Cookies.set('access_token', newAccess, { expires: 1, sameSite: 'strict' });
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  getAddresses: () => api.get('/auth/addresses/'),
  createAddress: (data) => api.post('/auth/addresses/', data),
  updateAddress: (id, data) => api.patch(`/auth/addresses/${id}/`, data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}/`),
};

// ── Products ──────────────────────────────────────
export const productsApi = {
  list: (params) => api.get('/products/', { params }),
  featured: () => api.get('/products/featured/'),
  detail: (slug) => api.get(`/products/${slug}/`),
  categories: () => api.get('/products/categories/'),
  banners: () => api.get('/products/banners/'),
};

// ── Cart ──────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart/'),
  add: (product_id, quantity = 1) => api.post('/cart/add/', { product_id, quantity }),
  update: (item_id, quantity) => api.patch(`/cart/items/${item_id}/`, { quantity }),
  remove: (item_id) => api.delete(`/cart/items/${item_id}/`),
  clear: () => api.delete('/cart/'),
};

// ── Orders ────────────────────────────────────────
export const ordersApi = {
  create: (data) => api.post('/orders/create/', data),
  list: () => api.get('/orders/'),
  detail: (id) => api.get(`/orders/${id}/`),
  applyCoupon: (data) => api.post('/orders/apply-coupon/', data),
  // Stripe
  stripeCreateIntent: () => api.post('/orders/stripe/create-intent/'),
  // PayPal
  paypalCreateOrder: () => api.post('/orders/paypal/create-order/'),
  paypalCapture: (data) => api.post('/orders/paypal/capture/', data),
};

// ── Contact ───────────────────────────────────────
export const contactApi = {
  submit: (data) => api.post('/contact/', data),
};

// ── Reviews ───────────────────────────────────────
export const reviewsApi = {
  list: (slug) => api.get(`/products/${slug}/reviews/`),
  create: (slug, data) => api.post(`/products/${slug}/reviews/`, data),
};

// ── Wishlist ──────────────────────────────────────
export const wishlistApi = {
  list: () => api.get('/auth/wishlist/'),
  add: (product_id) => api.post('/auth/wishlist/', { product_id }),
  remove: (product_id) => api.delete(`/auth/wishlist/${product_id}/remove/`),
  check: (product_id) => api.get(`/auth/wishlist/${product_id}/check/`),
};
