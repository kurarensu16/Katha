import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
    const { user, isLoggedIn, setView, APIService, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Account settings state
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Preferences state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('katha:theme') || 'light';
    });
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            setView('login');
            return;
        }
        setUsername(user?.username || '');
        setEmail(user?.email || '');
        
        // Fetch user details from API to get latest email
        const fetchUserDetails = async () => {
            try {
                const response = await APIService.fetch('user/me/');
                if (response.ok) {
                    const userData = await response.json();
                    setEmail(userData.email || '');
                    setUsername(userData.username || '');
                }
            } catch (err) {
                console.error('Failed to fetch user details:', err);
            }
        };
        
        fetchUserDetails();
    }, [isLoggedIn, user, setView, APIService]);

    useEffect(() => {
        // Sync theme with sidebar
        const storedTheme = localStorage.getItem('katha:theme') || 'light';
        setTheme(storedTheme);
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('katha:theme', newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        
        setMessage({ type: 'success', text: 'Theme updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleAccountUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validate username
        if (!username || username.trim().length < 3) {
            setMessage({ type: 'error', text: 'Username must be at least 3 characters long.' });
            setLoading(false);
            return;
        }

        if (username.length > 30) {
            setMessage({ type: 'error', text: 'Username must be 30 characters or less.' });
            setLoading(false);
            return;
        }

        // Check if username contains only allowed characters
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setMessage({ type: 'error', text: 'Username can only contain letters, numbers, and underscores.' });
            setLoading(false);
            return;
        }

        // Check if username is just numbers
        if (/^\d+$/.test(username)) {
            setMessage({ type: 'error', text: 'Username cannot be just numbers.' });
            setLoading(false);
            return;
        }

        try {
            const response = await APIService.fetch('user/me/', {
                method: 'PATCH',
                body: JSON.stringify({ username: username.trim(), email })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setEmail(updatedUser.email || '');
                setUsername(updatedUser.username || '');
                setMessage({ type: 'success', text: 'Account settings updated successfully!' });
                
                // Refresh user data in context
                if (refreshUser) {
                    await refreshUser();
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to update account' }));
                const errorMessage = errorData.username?.[0] || errorData.error || 'Failed to update account settings.';
                setMessage({ type: 'error', text: errorMessage });
            }
        } catch (err) {
            console.error('Account update error:', err);
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match!' });
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long!' });
            setLoading(false);
            return;
        }

        // TODO: Implement API call to change password
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }, 500);
    };

    const handlePreferencesSave = (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Save preferences to localStorage
        localStorage.setItem('katha:notifications', JSON.stringify(notifications));
        localStorage.setItem('katha:emailNotifications', JSON.stringify(emailNotifications));
        
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Preferences saved successfully!' });
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }, 300);
    };

    if (!isLoggedIn) {
        return null; // Will redirect to login
    }

    const tabs = [
        { 
            id: 'account', 
            label: 'Account', 
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/></svg>
        },
        { 
            id: 'security', 
            label: 'Security', 
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6V10C4 15.5228 7.47715 20.4772 12 22C16.5228 20.4772 20 15.5228 20 10V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        },
        { 
            id: 'preferences', 
            label: 'Preferences', 
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-primary-deep dark:text-slate-100">
                Settings
            </h1>

            {/* Message Banner */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-md ${
                    message.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'text-blue-medium border-b-2 border-blue-medium dark:text-blue-accent dark:border-blue-accent'
                                : 'text-gray-600 dark:text-gray-400 hover:text-primary-deep dark:hover:text-slate-200'
                        }`}
                    >
                        <span className="mr-2 inline-flex items-center">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Account Tab */}
            {activeTab === 'account' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-primary-deep dark:text-slate-100">
                        Account Information
                    </h2>
                    <form onSubmit={handleAccountUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                                placeholder="Your username"
                                minLength={3}
                                maxLength={30}
                                pattern="[a-zA-Z0-9_]+"
                                title="Username can only contain letters, numbers, and underscores. Must be 3-30 characters."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Username must be 3-30 characters, letters, numbers, and underscores only. Cannot be just numbers.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                                placeholder="your@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-md font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-primary-deep dark:text-slate-100">
                        Change Password
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Password must be at least 8 characters long.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-md font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="space-y-6">
                    {/* Theme Preference */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-primary-deep dark:text-slate-100">
                            Appearance
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-3 text-text-dark dark:text-gray-300">
                                    Theme
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        className={`px-4 py-3 rounded-md border-2 transition-colors flex flex-col items-center ${
                                            theme === 'light'
                                                ? 'border-blue-medium bg-blue-50 dark:bg-slate-700 text-blue-medium dark:text-blue-accent'
                                                : 'border-gray-200 dark:border-slate-600 hover:border-blue-medium dark:hover:border-blue-accent text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                                            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        <span className="text-sm font-medium">Light</span>
                                    </button>
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        className={`px-4 py-3 rounded-md border-2 transition-colors flex flex-col items-center ${
                                            theme === 'dark'
                                                ? 'border-blue-medium bg-blue-50 dark:bg-slate-700 text-blue-medium dark:text-blue-accent'
                                                : 'border-gray-200 dark:border-slate-600 hover:border-blue-medium dark:hover:border-blue-accent text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className="text-sm font-medium">Dark</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-primary-deep dark:text-slate-100">
                            Notifications
                        </h2>
                        <form onSubmit={handlePreferencesSave} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-text-dark dark:text-gray-300">
                                        Browser Notifications
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Receive notifications in your browser
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications}
                                        onChange={(e) => setNotifications(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-medium"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-text-dark dark:text-gray-300">
                                        Email Notifications
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Receive email notifications for important updates
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications}
                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-medium"></div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 rounded-md font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

