import axios from 'axios';

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
        if (error.response?.status === 401 && unauthorizedHandler) {
            unauthorizedHandler();
        }

        return Promise.reject(error);
    },
);

export default api;
