import axios from 'axios';

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

const axiosInstance = axios.create({
    baseURL: '',
    headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
    const csrftoken = getCookie('csrftoken');
    config.headers['X-CSRFToken'] = csrftoken;

    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Token ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor
axiosInstance.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;
