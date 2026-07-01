import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            delete axios.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/user');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // Obtenir le cookie CSRF
        await axios.get('/sanctum/csrf-cookie');
        
        const response = await axios.post('/api/login', { email, password });
        if (response.data.success) {
            const newToken = response.data.data.token;
            setToken(newToken);
            localStorage.setItem('auth_token', newToken);
            setUser(response.data.data.user);
        }
        return response.data;
    };

    const register = async (data) => {
        await axios.get('/sanctum/csrf-cookie');
        
        const response = await axios.post('/api/register', data);
        if (response.data.success) {
            const newToken = response.data.data.token;
            setToken(newToken);
            localStorage.setItem('auth_token', newToken);
            setUser(response.data.data.user);
        }
        return response.data;
    };

    const logout = async () => {
        try {
            if (token) {
                await axios.post('/api/logout');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('auth_token');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
