import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),
  logout: () => api.post('/admin/logout'),
  getMe: () => api.get('/admin/me'),
};

export const ticketsAPI = {
  getAll: (params?: { search?: string; used?: boolean }) =>
    api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  updateStatus: (id: string, used: boolean) =>
    api.patch(`/tickets/${id}`, { used }),
  exportCSV: () => api.get('/tickets/export/csv', { responseType: 'blob' }),
  exportNames: () => api.get('/tickets/export/names'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};
