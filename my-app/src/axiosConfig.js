import axios from 'axios';

// Utility function to get the CSRF token from cookies
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

let csrftoken = getCookie('csrftoken');

// Log the CSRF token to the console for debugging
console.log('Initial CSRF Token:', csrftoken);

// Create an instance of axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000', // Ensure this is the correct URL of your backend
    headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Ensures cookies are sent with requests
});

// Set the Authorization header if a token is present in localStorage
const token = localStorage.getItem('token');
if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = 'Token ' + token;
}

// Interceptor to update CSRF token from response cookies
axiosInstance.interceptors.response.use((response) => {
    csrftoken = getCookie('csrftoken');
    axiosInstance.defaults.headers['X-CSRFToken'] = csrftoken;
    console.log('Updated CSRF Token:', csrftoken);
    return response;
}, (error) => {
    return Promise.reject(error);
});

// Log the default headers for debugging
console.log('Axios Default Headers:', axiosInstance.defaults.headers);

export default axiosInstance;
