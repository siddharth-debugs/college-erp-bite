import axios from 'axios';
import type {
    AxiosInstance,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';
import Session from '../Utils/session';
import Notifier from '../Utils/notifier';



const PUBLIC_URLS = ['/login'];

// ✅ Token exclusion helper
function isRequireToken(url?: string): boolean {
    if (!url) return true;
    const match = PUBLIC_URLS.filter((u) => url.endsWith(u));
    return match.length === 0;
}

// ✅ Create isolated instance
const axiosInstance: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_DEV_URL,
    headers: {
        Accept: 'application/json',
    },
});

// ✅ Axios Request Interceptor
axiosInstance.interceptors.request.use(
    function (config: InternalAxiosRequestConfig) {
        // Only set Content-Type if it's not FormData
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        config.headers['Accept'] = 'application/json';
        if (isRequireToken(config.url)) {
            const token = Session.get('token');
            if (token) {
                config.headers['Authorization'] = `Token ${token}`;
            }
        }

        return config;
    },
    function (error: AxiosError) {
        return Promise.reject(error);
    }
);

// ✅ Axios Response Interceptor
axiosInstance.interceptors.response.use(
    function (response) {
        return response.data;
    },
    function (error: AxiosError) {
        if (!error.response && error.message === 'Network Error') {
            Notifier.error('Couldn\'t connect to server. Please try again later.');
            return Promise.reject(error);
        }

        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                Notifier.error('Unauthorized access. Please login again.');
                Session.remove('token');
                localStorage.removeItem('token');

                setTimeout(() => {
                    window.location.replace('/Login');
                }, 100);
                return Promise.reject(data);
            }

            if (status === 500) {
                Notifier.error('Server error occurred. Please try again later.');
                return Promise.reject('Internal Server Error');
            }

            // ✅ Show error details if available (400, 403, etc.)
            if (data && typeof data === 'object') {
                const errorData = data as Record<string, any>;
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorData.errors.forEach((msg: string) => Notifier.error(msg));
                } else if (errorData.detail) {
                    Notifier.error(errorData.detail);
                } else {
                    Object.entries(errorData).forEach(([field, message]) => {
                        Notifier.error(`${field}: ${message}`);
                    });
                }
            }

            return Promise.reject(data);
        }

        // Fallback error
        Notifier.error('Unexpected error occurred. Please try again.');
        return Promise.reject('Unexpected error occurred');
    }
);

// ✅ HTTP Request Class
export default class HTTP {
    static Request(method: string, url: string, data: any = null): Promise<any> {
        return new Promise((resolve, reject) => {
            const isFormData = data instanceof FormData;

            const request: any = {
                method,
                url,
                [method.toUpperCase() === 'GET' ? 'params' : 'data']: data,
                headers: {
                    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                },
            };

            axiosInstance(request)
                .then((response) => resolve(response))
                .catch((error) => {
                    console.log('error is interceptors', error);
                    reject(error);
                });
        });
    }
}
