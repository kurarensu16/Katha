import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PostItem from '../components/posts/PostItem';

const ProfilePage = () => {
    const { user, isLoggedIn, APIService, setView, currentUsername } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        postsCount: 0,
        totalVotes: 0,
        commentsCount: 0
    });

    // Determine which user's profile to show
    const targetUsername = currentUsername || user?.username;
    const isOwnProfile = !currentUsername || currentUsername === user?.username;

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const response = await APIService.fetch('posts/');
                
                if (response.ok) {
                    const allPosts = await response.json();
                    // Filter posts by target username
                    const filtered = allPosts.filter(post => 
                        post.author_username === targetUsername
                    );
                    setUserPosts(filtered);
                    
                    // Set profile user info from first post (or use current user)
                    if (filtered.length > 0) {
                        setProfileUser({
                            username: filtered[0].author_username,
                            // We don't have other user info from the API, so we'll use what we have
                        });
                    } else if (targetUsername) {
                        // User exists but has no posts
                        setProfileUser({ username: targetUsername });
                    }
                    
                    // Calculate stats
                    const postsCount = filtered.length;
                    const totalVotes = filtered.reduce((sum, post) => sum + (post.votes || 0), 0);
                    const commentsCount = filtered.reduce((sum, post) => sum + (post.comment_count || 0), 0);
                    
                    setStats({
                        postsCount,
                        totalVotes,
                        commentsCount
                    });
                    setError(null);
                } else {
                    console.error("Failed to fetch posts:", response.status);
                    setError("Could not load user profile.");
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
                setError("Network connection issue. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (targetUsername) {
            fetchUserProfile();
        }
    }, [targetUsername, APIService]);

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-primary-deep dark:text-blue-accent">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-medium dark:border-blue-accent mr-3"></div>
                Loading Profile...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 md:p-8 mb-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-20 w-20 rounded-full bg-blue-accent flex items-center justify-center text-primary-deep dark:text-primary-deep font-bold text-3xl">
                        {targetUsername?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-primary-deep dark:text-slate-100">
                            {targetUsername || 'User'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Member since {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-medium dark:text-blue-accent">
                            {stats.postsCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Katha Posts
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-medium dark:text-blue-accent">
                            {stats.totalVotes}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Total Votes
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-medium dark:text-blue-accent">
                            {stats.commentsCount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Comments
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-md mb-6 text-red-700 dark:text-red-300 font-medium">
                    {error}
                </div>
            )}

            {/* User's Posts */}
            <div>
                <h2 className="text-2xl font-bold mb-4 text-primary-deep dark:text-slate-100 border-b-2 border-blue-200 dark:border-slate-700 pb-2">
                    {isOwnProfile ? 'My Katha Posts' : `${targetUsername}'s Katha Posts`}
                </h2>
                
                {userPosts.length > 0 ? (
                    <div className="space-y-6">
                        {userPosts.map(post => (
                            <PostItem key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                            {isOwnProfile 
                                ? "You haven't created any posts yet."
                                : `${targetUsername} hasn't created any posts yet.`
                            }
                        </p>
                        {isOwnProfile && (
                            <button
                                onClick={() => setView('create')}
                                className="px-6 py-2 rounded-full text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark transition-colors"
                            >
                                Create Your First Katha
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;

