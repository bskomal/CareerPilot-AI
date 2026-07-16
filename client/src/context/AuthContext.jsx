import React, { createContext, useState, useEffect } from 'react';
import axios, { API_BASE } from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Fetch user details error:', err.message);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMe(token);
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        await fetchMe(newToken);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await axios.post('/api/auth/register', { name, email, password });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        await fetchMe(newToken);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, login, register, logout, API_BASE }}>
            {children}
        </AuthContext.Provider>
    );
};
