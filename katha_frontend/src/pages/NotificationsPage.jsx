import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
    const { isLoggedIn, setView, APIService } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setView('login');
            return;
        }

        const fetchNotifications = async () => {
            try {
                const response = await APIService.fetch('notifications/');
                
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                    setError(null);
                } else {
                    setError('Failed to load notifications.');
                }
            } catch (err) {
                console.error('Network or parsing error:', err);
                setError('Network connection issue. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isLoggedIn, APIService, setView]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            const response = await APIService.fetch(`notifications/${notificationId}/mark_read/`, {
                method: 'POST'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await APIService.fetch('notifications/mark_all_read/', {
                method: 'POST'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }
        setView('detail', notification.post_id);
    };

    if (!isLoggedIn) {
        return null; // Will redirect to login
    }

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-primary-deep dark:text-blue-accent">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-medium dark:border-blue-accent mr-3"></div>
                Loading Notifications...
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-primary-deep dark:text-slate-100">
                    Notifications
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark transition-colors"
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            {error && (
                <div className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-md mb-6 text-red-700 dark:text-red-300 font-medium">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                !notification.read
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                            } hover:shadow-md`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                    !notification.read ? 'bg-blue-medium' : 'bg-transparent'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm mb-1">
                                        <span className="font-semibold text-primary-deep dark:text-slate-100">
                                            {notification.actor_username}
                                        </span>
                                        {' '}
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {notification.notification_type === 'comment' ? 'commented on' : 'replied to'}
                                        </span>
                                        {' '}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setView('detail', notification.post_id);
                                            }}
                                            className="font-medium text-blue-medium dark:text-blue-accent hover:underline"
                                        >
                                            {notification.post_title}
                                        </button>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {notification.comment_text}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            No notifications yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

