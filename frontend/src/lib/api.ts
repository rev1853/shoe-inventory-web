import axios from 'axios';
import { toast } from 'sonner@2.0.3';

const api = axios.create({
    // baseURL: 'https://shoe-inventory-api.truesurvi4.xyz/api',
    baseURL: "http://localhost:8000/api"
});

let unauthorizedHandler: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
};

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message ?? 'An unexpected error occurred.';

        if (status === 401 && unauthorizedHandler) {
            unauthorizedHandler();
            toast.error(message || 'Session expired. Please log in again.');
        } else if (status) {
            toast.error(message);
        } else {
            toast.error('Network error. Please check your connection.');
        }

        return Promise.reject(error);
    },
);

export default api;
