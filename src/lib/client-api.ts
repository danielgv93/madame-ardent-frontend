interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function authenticatedFetch(url: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}