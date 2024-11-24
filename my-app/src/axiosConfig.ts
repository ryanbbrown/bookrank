import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosError, 
  AxiosResponse,
  AxiosRequestHeaders 
} from 'axios';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(trimmedCookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken = getCookie('csrftoken');

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'X-CSRFToken': csrftoken,
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
      config.headers.set('X-CSRFToken', csrftoken);
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        const tokenValue = token.startsWith('Token ') ? token : `Token ${token}`;
        config.headers.set('Authorization', tokenValue);
      }
    }
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 