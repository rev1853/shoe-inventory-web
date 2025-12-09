const API_BASE_STORAGE_KEY = 'api_base_url';

const SERVER_OPTIONS = [
    { label: 'Localhost (http://localhost:8000/api)', value: 'http://localhost:8000/api' },
    { label: 'Cloud (https://shoe-inventory-api.truesurvi4.xyz/api)', value: 'https://shoe-inventory-api.truesurvi4.xyz/api' },
    { label: 'Host (http://195.201.149.228:5003/api)', value: 'http://195.201.149.228:5003/api' },
];

const DEFAULT_SERVER = SERVER_OPTIONS[0].value;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getStoredApiBaseUrl = () => {
    if (!canUseStorage()) return DEFAULT_SERVER;

    const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
    if (stored && SERVER_OPTIONS.some((option) => option.value === stored)) {
        return stored;
    }

    return DEFAULT_SERVER;
};

const setStoredApiBaseUrl = (value: string) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(API_BASE_STORAGE_KEY, value);
};

export { API_BASE_STORAGE_KEY, SERVER_OPTIONS, DEFAULT_SERVER, getStoredApiBaseUrl, setStoredApiBaseUrl };
