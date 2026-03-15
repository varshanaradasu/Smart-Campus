import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, loginUser } from '../services/authService';

const AuthContext = createContext(null);
const getStoredToken = () => localStorage.getItem('sco_token') || localStorage.getItem('token') || '';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            const token = getStoredToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const profile = await getProfile();
                setUser(profile.user);
            } catch (_error) {
                localStorage.removeItem('sco_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const login = async (payload) => {
        const response = await loginUser(payload);
        localStorage.setItem('sco_token', response.token);
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return response;
    };

    const logout = () => {
        localStorage.removeItem('sco_token');
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return ctx;
};
