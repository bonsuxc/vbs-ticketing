import axios from 'axios';

// Configure your API base URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),
  logout: () => api.post('/admin/logout'),
  me: () => api.get('/admin/me'),
};

export const ticketsAPI = {
  getAll: (params?: { search?: string; used?: boolean }) =>
    api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  updateStatus: (id: string, used: boolean) =>
    api.patch(`/tickets/${id}`, { used }),
  exportNames: () => api.get('/tickets/export/names'),
  exportPhones: () => api.get('/tickets/export/phones'),
  exportCSV: () => api.get('/tickets/export/csv', { responseType: 'blob' }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

