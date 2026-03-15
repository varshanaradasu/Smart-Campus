import axios from 'axios';

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
    const token = localStorage.getItem('sco_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
