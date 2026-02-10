import { appAuth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Get fresh Firebase ID token
export const getAuthToken = async () => {
  const user = appAuth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return await user.getIdToken();
};

export const apiFetch = async (endpoint, { method = 'GET', body, requireAuth = true, ...options } = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get fresh token for authenticated requests
  let authToken;
  if (requireAuth) {
    try {
      authToken = await getAuthToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required');
    }
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...(options.headers || {}),
    },
    ...options,
    ...(body && { body: JSON.stringify(body) }),
  };
  
  let res;
  try {
    res = await fetch(url, config);
  } catch (fetchError) {
    console.error('Network error:', fetchError.message);
    throw new Error(`Network error: ${fetchError.message}`);
  }
  
  if (!res.ok) {
    let errorText;
    try {
      errorText = await res.text();
      console.error('API Error:', errorText);
    } catch (textError) {
      errorText = `Request failed: ${res.status} ${res.statusText}`;
    }
    
    throw new Error(errorText || `Request failed: ${res.status}`);
  }

  const ct = res.headers.get('content-type');
  return ct && ct.includes('application/json') ? res.json() : res.text();
};
