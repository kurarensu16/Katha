import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PostItem from '../components/posts/PostItem';

const MyPostsPage = () => {
    const { user, isLoggedIn, APIService, setView } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            setView('login');
            return;
        }

        const fetchMyPosts = async () => {
            try {
                const response = await APIService.fetch('posts/');
                
                if (response.ok) {
                    const allPosts = await response.json();
                    // Filter posts by current user
                    const filtered = allPosts.filter(post => 
                        post.author_username === user?.username
                    );
                    setPosts(filtered);
                    setError(null);
                } else {
                    console.error("Failed to fetch posts:", response.status);
                    setError("Could not load your posts.");
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
                setError("Network connection issue. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyPosts();
    }, [isLoggedIn, user, APIService, setView]);

    if (!isLoggedIn) {
        return null; // Will redirect to login
    }

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-primary-deep dark:text-blue-accent">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-medium dark:border-blue-accent mr-3"></div>
                Loading Your Posts...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-extrabold mb-6 border-b-2 border-blue-200 dark:border-slate-700 pb-3 text-primary-deep dark:text-slate-100 bg-gradient-to-r from-blue-dark to-blue-medium bg-clip-text text-transparent">
                My Posts
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
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                            You haven't created any posts yet.
                        </p>
                        <button
                            onClick={() => setView('create')}
                            className="px-6 py-2 rounded-full text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark transition-colors"
                        >
                            Create Your First Katha
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPostsPage;

