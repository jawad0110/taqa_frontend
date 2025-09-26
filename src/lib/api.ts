import apiClient from './axios';

// Example API functions using the configured axios client
export const adminApi = {
  // Products
  getProducts: () => apiClient.get('/admin/products'),
  getProduct: (uid: string) => apiClient.get(`/admin/products/${uid}`),
  createProduct: (data: any) => apiClient.post('/admin/products', data),
  updateProduct: (uid: string, data: any) => apiClient.put(`/admin/products/${uid}`, data),
  deleteProduct: (uid: string) => apiClient.delete(`/admin/products/${uid}`),
  
  // Categories
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (data: any) => apiClient.post('/admin/categories', data),
  
  // Orders
  getOrders: () => apiClient.get('/admin/orders'),
  getOrder: (uid: string) => apiClient.get(`/admin/orders/${uid}`),
  
  // Analytics
  getOverview: () => apiClient.get('/admin/overview'),
  getSalesAnalytics: () => apiClient.get('/admin/sales-analytics'),
};

// User API functions
export const userApi = {
  // Cart
  getCart: () => apiClient.get('/cart'),
  addToCart: (data: any) => apiClient.post('/cart', data),
  
  // Products
  getProducts: (params?: any) => apiClient.get('/products', { params }),
  getProduct: (uid: string) => apiClient.get(`/products/${uid}`),
  
  // Profile
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (data: any) => apiClient.put('/profile', data),
  
  // Wishlist
  getWishlist: () => apiClient.get('/wishlist'),
  addToWishlist: (productUid: string) => apiClient.post('/wishlist', { product_uid: productUid }),
  removeFromWishlist: (productUid: string) => apiClient.delete(`/wishlist/${productUid}`),
  checkWishlistStatus: (productUid: string) => apiClient.get(`/wishlist/check/${productUid}`),
  batchCheckWishlistStatus: (productUids: string[]) => apiClient.post('/wishlist/batch-check', productUids),
  getWishlistCount: () => apiClient.get('/wishlist/count'),
};