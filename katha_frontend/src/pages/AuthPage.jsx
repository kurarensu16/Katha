import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import APIService from '../api/APIService';

const AuthForm = ({ type }) => {
    const { login, oauthLogin, setView } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState({ google: false });
    const [showPassword, setShowPassword] = useState(false);

    const isLogin = type === 'login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (isLogin) {
            const result = await login(username, password);
            if (result.success) {
                setView('feed');
            } else {
                setError("Login failed. Check your username and password.");
            }
        } else {
            // Registration logic
            try {
                // Client-side password checks to give fast feedback
                const pwd = password || '';
                const issues = [];
                if (pwd.length < 8) issues.push('at least 8 characters');
                if (!/[a-z]/.test(pwd)) issues.push('one lowercase letter');
                if (!/[A-Z]/.test(pwd)) issues.push('one uppercase letter');
                if (!/\d/.test(pwd)) issues.push('one digit');
                if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) issues.push('one special character');
                if (issues.length) {
                    setError(`Password must include ${issues.join(', ')}.`);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, email }),
                });

                if (response.ok) {
                    alert('Registration successful! Please log in.');
                    setView('login');
                } else {
                    const errorData = await response.json();
                    // Prefer password-specific messages when present
                    const passwordErrors = errorData.password;
                    const usernameErrors = errorData.username;
                    if (passwordErrors) {
                        setError([].concat(passwordErrors).join(' | '));
                    } else if (usernameErrors) {
                        setError([].concat(usernameErrors).join(' | '));
                    } else {
                        setError(Object.values(errorData).flat().join(' | '));
                    }
                }
            } catch (err) {
                setError("Network error during registration. Ensure Django server is running.");
            }
        }
        setLoading(false);
    };

    // Initialize Google OAuth on component mount
    useEffect(() => {
        const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        
        if (!GOOGLE_CLIENT_ID) {
            return; // Google OAuth not configured
        }

        const loadGoogleScript = () => {
            if (window.google && window.google.accounts) {
                initializeGoogle();
            } else {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = initializeGoogle;
                script.onerror = () => console.error('Failed to load Google Identity Services');
                document.head.appendChild(script);
            }
        };

        const initializeGoogle = () => {
            if (!window.google || !window.google.accounts) return;
            
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    setOauthLoading(prev => ({ ...prev, google: true }));
                    setError(null);
                    try {
                        const credential = response.credential;
                        const result = await oauthLogin('google', credential);
                        
                        if (result.success) {
                            setView('feed');
                        } else {
                            setError(result.error || 'Google login failed');
                        }
                    } catch (err) {
                        setError('Failed to process Google login');
                    } finally {
                        setOauthLoading(prev => ({ ...prev, google: false }));
                    }
                },
            });

            // Render Google sign-in button
            const buttonContainer = document.getElementById('google-signin-button');
            if (buttonContainer && !buttonContainer.hasChildNodes()) {
                const containerWidth = buttonContainer.offsetWidth || buttonContainer.clientWidth || 320;
                const buttonWidth = Math.max(240, Math.min(containerWidth, 400)); // Google allows 120-400px
                
                buttonContainer.innerHTML = '';
                window.google.accounts.id.renderButton(buttonContainer, {
                    theme: 'outline',
                    size: 'large',
                    width: buttonWidth,
                    text: 'signin_with'
                });
            }
        };

        loadGoogleScript();
    }, [oauthLogin, setView]);


    return (
        <div className="max-w-md mx-auto p-8 rounded-lg shadow-2xl mt-10 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold leading-tight mb-6 text-center dark:text-slate-100 bg-linear-to-r from-blue-dark to-blue-medium bg-clip-text text-transparent dark:from-blue-accent dark:to-blue-medium">
                {isLogin ? 'Log In to Katha' : 'Register for Katha'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded text-sm">
                        {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-text-dark">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition"
                        required
                    />
                </div>
                
                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark">Email (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-text-dark">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 pr-11 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 mt-1 mr-2 flex items-center justify-center h-9 w-9 rounded-md text-gray-600 hover:text-blue-medium focus:outline-none"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                // Eye off icon
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M10.5858 7.41421C11.0335 7.27369 11.5116 7.19995 12 7.19995C14.6522 7.19995 16.8 9.34774 16.8 11.9999C16.8 12.4884 16.7263 12.9665 16.5858 13.4142" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M9.6 12C9.6 10.5639 10.7639 9.39995 12.2 9.39995" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M2 12C2 12 5.63636 6.79995 12 6.79995C13.8195 6.79995 15.4388 7.23267 16.8 7.93628" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M21.9999 12C21.9999 12 19.3536 16.5712 13.2 17.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            ) : (
                                // Eye icon
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 12C2 12 5.63636 6.8 12 6.8C18.3636 6.8 22 12 22 12C22 12 18.3636 17.2 12 17.2C5.63636 17.2 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-md font-semibold text-lg transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                </button>
            </form>

            {/* SSO Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                </div>
            </div>

            {/* SSO Buttons */}
            <div className="space-y-3">
                {/* Google Sign-In Button Container */}
                <div id="google-signin-button" className="w-full"></div>
            </div>

            <div className="mt-6 text-center text-sm text-text-dark dark:text-gray-300">
                {isLogin ? (
                    <span>
                        New to Katha?{' '}
                        <button onClick={() => setView('register')} className="font-semibold hover:underline text-blue-medium">
                            Register here
                        </button>
                    </span>
                ) : (
                    <span>
                        Already have an account?{' '}
                        <button onClick={() => setView('login')} className="font-semibold hover:underline text-blue-medium">
                            Log In
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
};

export default AuthForm;