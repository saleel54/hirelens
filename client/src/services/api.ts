const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to retrieve stored auth tokens
 */
export const getToken = (): string | null => {
  return localStorage.getItem('hirelens_token');
};

/**
 * Standard HTTP Fetch Request client with Auth headers automatically integrated
 */
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set default content type to JSON if sending payload and not multipart form data
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API request failed with status ${response.status}`) as any;
    error.status = response.status;
    throw error;
  }

  return response.json();
};
