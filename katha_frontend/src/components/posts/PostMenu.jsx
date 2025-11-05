import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PostMenu = ({ post, onSaveUpdate }) => {
    const { isLoggedIn, APIService, setView } = useAuth();
    const [isSaved, setIsSaved] = useState(post?.is_saved || false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (post?.is_saved !== undefined) {
            setIsSaved(post.is_saved);
        }
    }, [post?.is_saved]);

    const handleSave = async () => {
        if (!isLoggedIn) {
            alert('Please log in to save posts');
            return;
        }

        if (isSaving) return;

        setIsSaving(true);
        const oldSaved = isSaved;
        setIsSaved(!isSaved); // Optimistic update

        try {
            const response = await APIService.fetch(`posts/${post.id}/save/`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to save post');
            }

            const data = await response.json();
            setIsSaved(data.is_saved);
            if (onSaveUpdate) {
                onSaveUpdate(data.is_saved);
            }
            setMenuOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            setIsSaved(oldSaved); // Revert on error
            alert('Failed to save post. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyLink = () => {
        const postUrl = `${window.location.origin}/#post-${post.id}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            alert('Link copied to clipboard!');
            setMenuOpen(false);
        }).catch(() => {
            alert('Failed to copy link');
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.content?.substring(0, 200) || '',
                url: `${window.location.origin}/#post-${post.id}`
            }).then(() => {
                setMenuOpen(false);
            }).catch(() => {
                // User cancelled or share failed
            });
        } else {
            // Fallback to copy link
            handleCopyLink();
        }
    };

    const handleReport = () => {
        alert('Report feature coming soon!');
        setMenuOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuOpen && !e.target.closest('.post-menu-container')) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpen]);

    return (
        <div className="post-menu-container relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                }}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 transition-colors"
                aria-label="Post options"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
                </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-xl border border-gray-200 dark:border-slate-700 py-1 text-sm z-[100]">
                    {isLoggedIn ? (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                }}
                                disabled={isSaving}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white disabled:opacity-50"
                            >
                                {isSaved ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium">
                                        <path d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600 dark:text-gray-400">
                                        <path d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                                {isSaved ? 'Unsave Post' : 'Save Post'}
                            </button>
                            <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare();
                                }}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium">
                                    <path d="M18 8C19.6569 8 21 9.34315 21 11C21 12.6569 19.6569 14 18 14C16.3431 14 15 12.6569 15 11C15 9.34315 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 15C7.65685 15 9 16.3431 9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8.72727 13L15.2727 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8.72727 11L15.2727 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Share
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink();
                                }}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium">
                                    <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6466 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 11C13.5705 10.4259 13.0226 9.95085 12.3934 9.60707C11.7643 9.26329 11.0685 9.05886 10.3534 9.00766C9.63816 8.95645 8.92037 9.05972 8.24863 9.31026C7.5769 9.5608 6.96687 9.95302 6.45997 10.46L3.45997 13.46C2.54918 14.403 2.0452 15.666 2.0566 16.977C2.06799 18.288 2.59383 19.5421 3.52087 20.4691C4.44791 21.3962 5.70198 21.922 7.01296 21.9334C8.32394 21.9448 9.58695 21.4408 10.53 20.53L12.24 18.82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Copy Link
                            </button>
                            <div className="my-1 border-t border-gray-200 dark:border-slate-700"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReport();
                                }}
                                className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Report
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setView('login');
                                setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium">
                                <path d="M15 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 17L14 13L10 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Log In to Save
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostMenu;

