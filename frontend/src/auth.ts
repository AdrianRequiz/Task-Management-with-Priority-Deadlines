const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const getAccessToken = () => localStorage.getItem('access_token');

export const isAuthenticated = () => !!getAccessToken();

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/jwt/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await fetch(`${API_BASE}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, re_password: password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }
  return response.json();
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getUserInfo = async () => {
  const response = await authFetch(`${API_BASE}/users/me/`);
  if (!response.ok) throw new Error('Failed to fetch user info');
  return response.json();
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(fullUrl, { ...options, headers: { ...headers, ...options.headers } });
  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please login again.');
  }
  return response;
};

export const activateAccount = async (email: string, code: string) => {
  const response = await fetch(`${API_BASE}/activate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Activation failed');
  }
  return response.json();
};