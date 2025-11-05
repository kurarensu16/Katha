import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PostItem from '../components/posts/PostItem';

const SavedPage = () => {
    const { user, isLoggedIn, APIService, setView } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setView('login');
            return;
        }

        const fetchSavedPosts = async () => {
            try {
                const response = await APIService.fetch('posts/saved/');
                
                if (response.ok) {
                    const data = await response.json();
                    setPosts(data);
                    setError(null);
                } else {
                    console.error("Failed to fetch saved posts:", response.status);
                    setError("Could not load your saved posts.");
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
                setError("Network connection issue. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchSavedPosts();
    }, [isLoggedIn, APIService, setView]);

    if (!isLoggedIn) {
        return null; // Will redirect to login
    }

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-primary-deep dark:text-blue-accent">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-medium dark:border-blue-accent mr-3"></div>
                Loading Saved Posts...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-extrabold mb-6 border-b-2 border-blue-200 dark:border-slate-700 pb-3 text-primary-deep dark:text-slate-100 bg-gradient-to-r from-blue-dark to-blue-medium bg-clip-text text-transparent">
                Saved Posts
            </h2>
            
            {error && (
                <div className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-md mb-6 text-red-700 dark:text-red-300 font-medium">
                    {error}
                </div>
            )}
            
            <div className="space-y-6">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostItem key={post.id} post={post} />
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-gray-400 dark:text-gray-500">
                            <path d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
                            No saved posts yet.
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                            Save posts you want to read later by clicking the menu icon on any post.
                        </p>
                        <button
                            onClick={() => setView('feed')}
                            className="px-6 py-2 rounded-full text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark transition-colors"
                        >
                            Browse Feed
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedPage;

