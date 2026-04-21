import Cookies from 'js-cookie';

export function setTokens(access, refresh) {
  Cookies.set('access_token', access, { expires: 1, sameSite: 'strict' });
  Cookies.set('refresh_token', refresh, { expires: 7, sameSite: 'strict' });
}

export function clearTokens() {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
}

export function getAccessToken() {
  return Cookies.get('access_token');
}

export function isAuthenticated() {
  return !!Cookies.get('access_token');
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getImageUrl(path) {
  if (!path) return '/images/placeholder.png';
  if (path.startsWith('http')) return path;
  return `http://localhost:8000${path}`;
}

export function getOrderStatusColor(status) {
  const map = {
    pending: 'warning',
    paid: 'info',
    processing: 'info',
    shipped: 'accent',
    delivered: 'success',
    cancelled: 'error',
  };
  return map[status] || 'default';
}

export function extractErrors(error) {
  if (!error.response?.data) return 'An unexpected error occurred.';
  const data = error.response.data;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const msgs = Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' | ');
  return msgs || 'An error occurred.';
}
