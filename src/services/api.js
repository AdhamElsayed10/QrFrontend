import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';

if (baseURL && !baseURL.startsWith('http://') && !baseURL.startsWith('https://') && !baseURL.startsWith('/')) {
  baseURL = `https://${baseURL}`;
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.endsWith('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
