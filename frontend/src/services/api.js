import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartexam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Safely parses FastAPI/Pydantic or Network error responses into a human-readable string.
 * Prevents React runtime crash: "Objects are not valid as a React child".
 */
export function formatApiError(error) {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  const detail = error.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map(item => {
      if (typeof item === 'string') return item;
      if (item && item.msg) {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
        return field && field !== 'body' ? `${field}: ${item.msg}` : item.msg;
      }
      return JSON.stringify(item);
    }).join(' | ');
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  if (error.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error.message) {
    return String(error.message);
  }

  return 'Server error. Please try again.';
}

export default api;
