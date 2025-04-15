import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create();

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If we get a 401, clear auth state and trigger logout
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('app-logout'));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;