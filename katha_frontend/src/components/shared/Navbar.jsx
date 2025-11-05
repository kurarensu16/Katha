import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
    const { isLoggedIn, user, logout, setView, searchTerm, setSearchTerm, APIService } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const searchInputRef = useRef(null);
    const [localSearchValue, setLocalSearchValue] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearchValue(searchTerm || '');
    }, [searchTerm]);

    // Fetch notification count
    useEffect(() => {
        if (isLoggedIn) {
            const fetchNotifCount = async () => {
                try {
                    const response = await APIService.fetch('notifications/unread_count/');
                    if (response.ok) {
                        const data = await response.json();
                        setNotifCount(data.count || 0);
                    }
                } catch (err) {
                    console.error('Failed to fetch notification count:', err);
                }
            };
            fetchNotifCount();
            // Poll every 30 seconds for new notifications
            const interval = setInterval(fetchNotifCount, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifCount(0);
        }
    }, [isLoggedIn, APIService]);

    // Fetch notifications when dropdown opens
    const fetchNotifications = async () => {
        if (!isLoggedIn || loadingNotifs) return;
        setLoadingNotifs(true);
        try {
            const response = await APIService.fetch('notifications/');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoadingNotifs(false);
        }
    };

    useEffect(() => {
        if (notifDropdownOpen && isLoggedIn) {
            fetchNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifDropdownOpen, isLoggedIn]);

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.read) {
            APIService.fetch(`notifications/${notification.id}/mark_read/`, {
                method: 'POST'
            }).then(() => {
                setNotifCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
            });
        }
        // Navigate to post
        setView('detail', notification.post_id);
        setNotifDropdownOpen(false);
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await APIService.fetch('notifications/mark_all_read/', {
                method: 'POST'
            });
            if (response.ok) {
                setNotifCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifDropdownOpen && !e.target.closest('.notification-dropdown')) {
                setNotifDropdownOpen(false);
            }
            if (menuOpen && !e.target.closest('.profile-menu')) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [notifDropdownOpen, menuOpen]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const term = e.currentTarget.value.trim();
            setSearchTerm(term);
            setView('feed');
            e.currentTarget.blur();
        }
    };

    const handleSearchChange = (e) => {
        setLocalSearchValue(e.target.value);
    };

    const openSearch = () => {
        searchInputRef.current?.focus();
    };

    // Focus search when global event is dispatched (Ctrl+K)
    useEffect(() => {
        const handler = () => {
            // Ensure any open dropdowns close and focus the search
            setMenuOpen(false);
            setNotifDropdownOpen(false);
            // Small delay to ensure layout is stable
            setTimeout(() => searchInputRef.current?.focus(), 0);
        };
        window.addEventListener('focus-global-search', handler);
        return () => window.removeEventListener('focus-global-search', handler);
    }, []);

    // Theme toggle lives in Sidebar now
    
    return (
        <header className="fixed top-0 left-0 right-0 z-50 shadow-lg bg-primary-deep dark:bg-[#0B1A37]">
            <div className="w-full px-2 md:px-3 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-md hover:bg-white/10 text-blue-accent"
                        aria-label="Toggle sidebar"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H21M3 12H15M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                    <div 
                        className="flex items-center space-x-3 cursor-pointer" 
                    onClick={() => setView('feed')}
                >
                    <h1 className="text-3xl font-black text-blue-accent font-tagalogika drop-shadow-lg tracking-tight">Katha</h1>
                    <span className="hidden sm:inline text-sm font-light italic ml-4 text-blue-accent/80">
                        "Bawat salaysay, may puwang."
                    </span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 pl-2 flex-1 justify-end">
                    {/* Right-aligned search bar (half width) */}
                    <div className="hidden md:block w-1/2 max-w-xl">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={localSearchValue}
                                onChange={handleSearchChange}
                                placeholder="Search stories, tags, users… (Ctrl+K)"
                                onKeyDown={handleSearchKeyDown}
                                className="w-full rounded-md border border-blue-200/40 dark:border-slate-600 bg-white/90 dark:bg-slate-700 text-text-dark dark:text-slate-100 px-9 py-2 text-sm focus:ring-2 focus:ring-blue-medium focus:border-blue-medium shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-300/70"
                            />
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 text-blue-medium dark:text-blue-accent"><path d="M21 21L15.803 15.803M18 10.5C18 14.0899 15.0899 17 11.5 17C7.91015 17 5 14.0899 5 10.5C5 6.91015 7.91015 4 11.5 4C15.0899 4 18 6.91015 18 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </div>
                    </div>  
                    {isLoggedIn ? (
                        <>

                            {/* Notifications */}
                            <div className="relative notification-dropdown">
                                <button 
                                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                    className="relative p-2 rounded-md text-blue-accent hover:bg-white/10" 
                                    aria-label="Notifications"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17H19M6 8C6 5.23858 8.23858 3 11 3C13.7614 3 16 5.23858 16 8V12L18 15H4L6 12V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    {notifCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center text-[10px] h-4 min-w-4 px-1 rounded-full bg-red-500 text-white font-bold">{notifCount}</span>
                                    )}
                                </button>
                                {notifDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white dark:bg-slate-800 rounded-md shadow-xl border border-gray-200 dark:border-slate-700 py-1 text-sm z-50 overflow-hidden flex flex-col">
                                            <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                                <h3 className="font-semibold text-primary-deep dark:text-slate-100">Notifications</h3>
                                                {notifCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-xs text-blue-medium dark:text-blue-accent hover:underline"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="overflow-y-auto max-h-80">
                                                {loadingNotifs ? (
                                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-medium mr-2"></div>
                                                        Loading...
                                                    </div>
                                                ) : notifications.length > 0 ? (
                                                    notifications.map(notif => (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 ${
                                                                !notif.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                                                    !notif.read ? 'bg-blue-medium' : 'bg-transparent'
                                                                }`}></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                                        <span className="font-semibold text-primary-deep dark:text-slate-100">{notif.actor_username}</span>
                                                                        {' '}
                                                                        {notif.notification_type === 'comment' ? 'commented on' : 'replied to'}
                                                                        {' '}
                                                                        <span className="font-medium text-blue-medium dark:text-blue-accent">{notif.post_title}</span>
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                                        {notif.comment_text}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                                        {new Date(notif.created_at).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                        No notifications yet
                                                    </div>
                                                )}
                                            </div>
                                            {notifications.length > 0 && (
                                                <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 text-center">
                                                    <button
                                                        onClick={() => { setView('notifications'); setNotifDropdownOpen(false); }}
                                                        className="text-xs text-blue-medium dark:text-blue-accent hover:underline"
                                                    >
                                                        View all notifications
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            {/* Theme toggle removed; use Sidebar control */}

                            {/* Profile menu */}
                            <div className="relative profile-menu">
                                <button
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="ml-1 h-8 w-8 rounded-full bg-blue-accent text-primary-deep dark:text-primary-deep font-bold text-sm flex items-center justify-center"
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                >
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 py-1 text-sm z-50">
                                        <button onClick={() => { setMenuOpen(false); setView('profile'); }} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium"><path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                                            Profile
                                        </button>
                                        <button onClick={() => { setMenuOpen(false); setView('settings'); }} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium">
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Settings
                                        </button>
                                        <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>
                                        <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M13 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setView('login')}
                                className="px-4 py-2 rounded-full text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark flex items-center gap-2"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => setView('register')}
                                className="px-4 py-2 rounded-full text-sm font-medium border border-text-light text-text-light hover:bg-white/10 hidden sm:inline-flex items-center gap-2"
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;