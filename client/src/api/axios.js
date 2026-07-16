import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://careerpilot-backend-5dk5.onrender.com';

const axiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 120000, // 2 minutes to handle Render cold starts
});

// Axios request interceptor to add Authorization token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Ensure Bearer prefix is added exactly once
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { API_BASE };
