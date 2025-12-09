const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

const canUseBrowser = () => typeof window !== 'undefined';

const setAuthCookie = (token: string) => {
    if (!canUseBrowser()) return;
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const clearAuthCookie = () => {
    if (!canUseBrowser()) return;
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
};

const getAuthCookie = () => {
    if (!canUseBrowser()) return null;
    const match = document.cookie.split('; ').find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));
    return match ? match.split('=')[1] : null;
};

const loadStoredAuthToken = () => {
    if (!canUseBrowser()) return null;
    return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? getAuthCookie();
};

const persistAuthToken = (token: string, remember: boolean) => {
    if (!canUseBrowser()) return;

    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    clearAuthCookie();

    if (remember) {
        setAuthCookie(token);
    } else {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
};

const clearStoredAuth = () => {
    if (!canUseBrowser()) return;
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    clearAuthCookie();
};

export {
    AUTH_TOKEN_KEY,
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE_SECONDS,
    getAuthCookie,
    loadStoredAuthToken,
    persistAuthToken,
    clearStoredAuth,
};
