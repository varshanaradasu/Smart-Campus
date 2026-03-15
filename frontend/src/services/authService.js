import api from './api';

export const loginUser = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
};

export const forgotPassword = async (payload) => {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
};

export const verifyOtp = async (payload) => {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
};

export const resetPassword = async (payload) => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
};

export const getProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
};
