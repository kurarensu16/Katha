import React, { useState, useEffect, createContext, useContext } from 'react';
import APIService from '../api/APIService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const decodeToken = (token) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { 
            username: payload.username || payload.user_id,
            email: payload.email || ''
        };
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [tokens, setTokens] = useState({ access: localStorage.getItem('access'), refresh: localStorage.getItem('refresh') });
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    const refreshUserData = async () => {
        if (tokens.access) {
            // Try to decode from token first (fast)
            const tokenData = decodeToken(tokens.access);
            
            // Fetch current user data from API to get latest username (in case it was updated)
            try {
                const response = await APIService.fetch('user/me/');
                if (response.ok) {
                    const userData = await response.json();
                    setUser({
                        username: userData.username || tokenData?.username,
                        email: userData.email || tokenData?.email || ''
                    });
                    return true;
                } else {
                    // Fallback to token data if API fails
                    setUser(tokenData);
                    return false;
                }
            } catch (err) {
                // Fallback to token data if API fails
                console.warn('Failed to fetch user data, using token:', err);
                setUser(tokenData);
                return false;
            }
        } else {
            setUser(null);
            return false;
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            await refreshUserData();
            setLoading(false);
        };

        fetchUserData();
    }, [tokens.access, APIService]);

    const handleLogin = async (username, password) => {
        const result = await APIService.login(username, password);
        if (result.success) {
            setTokens({ access: result.access, refresh: localStorage.getItem('refresh') });
            return { success: true };
        }
        return result;
    };

    const handleOAuthLogin = async (provider, accessToken) => {
        try {
            const response = await APIService.fetch(`auth/${provider}/`, {
                method: 'POST',
                body: JSON.stringify({ access_token: accessToken })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access', data.access);
                localStorage.setItem('refresh', data.refresh);
                setTokens({ access: data.access, refresh: data.refresh });
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({ error: 'OAuth login failed' }));
                return { success: false, error: errorData.error || 'OAuth login failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error during OAuth login' };
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setTokens({ access: null, refresh: null });
        setUser(null);
        // Does not navigate here, Router handles it via state change
    };

    const [currentView, setCurrentView] = useState({ view: 'feed', postId: null, username: null });
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('katha:search') || '');

    const handleViewChange = (view, postId = null, username = null) => {
        setCurrentView({ view, postId, username });
    };

    const updateSearchTerm = (term) => {
        const trimmedTerm = term.trim();
        setSearchTerm(trimmedTerm);
        if (trimmedTerm) {
            localStorage.setItem('katha:search', trimmedTerm);
        } else {
            localStorage.removeItem('katha:search');
        }
    };

    const value = {
        tokens,
        user,
        isLoggedIn: !!user,
        login: handleLogin,
        oauthLogin: handleOAuthLogin,
        logout: handleLogout,
        refreshUser: refreshUserData,
        currentView: currentView.view,
        currentPostId: currentView.postId,
        currentUsername: currentView.username,
        setView: handleViewChange,
        searchTerm,
        setSearchTerm: updateSearchTerm,
        APIService
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};