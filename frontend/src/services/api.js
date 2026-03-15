import axios from 'axios';

const getStoredToken = () => localStorage.getItem('sco_token') || localStorage.getItem('token') || '';

const rawApiBase = String(import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiBase
    ? rawApiBase.replace(/\/+$/, '').endsWith('/api')
        ? rawApiBase.replace(/\/+$/, '')
        : `${rawApiBase.replace(/\/+$/, '')}/api`
    : '';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
