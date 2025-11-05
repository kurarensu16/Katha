import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import CommentItem from '../components/posts/CommentItem';
import PostMenu from '../components/posts/PostMenu';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const PostDetailPage = () => {
    const { currentPostId, setView, APIService, isLoggedIn, user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Function to trigger a refresh (passed to CommentItem for replies)
    const handleCommentPosted = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const fetchPostDetail = async () => {
            if (!currentPostId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await APIService.fetch(`posts/${currentPostId}/`);
                if (response.ok) {
                    const data = await response.json();
                    setPost(data);
                    setEditTitle(data.title);
                    setEditContent(data.content);
                } else {
                    setError("Post not found or API error.");
                }
            } catch (err) {
                setError("Network error when fetching post detail. Check if Django is running.");
            } finally {
                setLoading(false);
            }
        };

        fetchPostDetail();
    }, [currentPostId, APIService, refreshTrigger]); // Added refreshTrigger dependency

    const isAuthor = post && user && post.author_username === user.username;

    const handleEdit = () => {
        setIsEditing(true);
        setEditTitle(post.title);
        setEditContent(post.content);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditTitle(post.title);
        setEditContent(post.content);
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim() || !editContent.trim()) {
            alert('Title and content cannot be empty');
            return;
        }

        setEditLoading(true);
        try {
            const response = await APIService.fetch(`posts/${currentPostId}/`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: editTitle.trim(),
                    content: editContent.trim()
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                setPost(updatedPost);
                setIsEditing(false);
                setRefreshTrigger(prev => prev + 1);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to update post' }));
                alert(errorData.error || 'Failed to update post');
            }
        } catch (error) {
            alert('Network error when updating post.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const response = await APIService.fetch(`posts/${currentPostId}/`, {
                method: 'DELETE'
            });

            if (response.ok || response.status === 204) {
                setView('feed');
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to delete post' }));
                alert(errorData.error || 'Failed to delete post');
            }
        } catch (error) {
            alert('Network error when deleting post.');
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert("You must be logged in to comment.");
            setView('login');
            return;
        }
        if (!commentText.trim()) return;

        setCommentLoading(true);
        const newComment = {
            post: currentPostId, 
            text: commentText,
            parent: null, // Top-level comment
        };

        try {
            const response = await APIService.fetch('comments/', {
                method: 'POST',
                body: JSON.stringify(newComment)
            });

            if (response.ok) {
                setCommentText('');
                handleCommentPosted(); // Trigger refresh
            } else {
                alert('Failed to post comment. Check API console.');
            }
        } catch (error) {
            alert('Network error when posting comment.');
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-text-dark">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-deep mr-3"></div>
                Loading Post Detail...
            </div>
        );
    }
    if (error) {
        return (
            <div className="text-center p-10 text-xl text-red-600 bg-red-50 border border-red-200 rounded-lg mx-4">
                {error}
            </div>
        );
    }
    if (!post) {
        return (
            <div className="text-center p-10 text-xl text-text-dark">
                Post Data Missing.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <button 
                onClick={() => setView('feed')} 
                className="mb-4 text-sm font-medium hover:underline flex items-center transition duration-150 text-blue-medium" 
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back to Feed
            </button>
            
            {/* Post Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 mb-8 border-t-4 border-t-blue-medium dark:border-t-blue-accent border border-gray-200 dark:border-slate-700 relative">
                {/* 3-dot menu button */}
                <div className="absolute top-6 right-6 z-10">
                    <PostMenu post={post} />
                </div>
                
                {/* Edit/Delete buttons for author */}
                {isAuthor && !isEditing && (
                    <div className="absolute top-6 right-20 z-10 flex gap-2">
                        <button
                            onClick={handleEdit}
                            className="p-2 rounded-md text-blue-medium dark:text-blue-accent hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Edit post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => setDeleteDialogOpen(true)}
                            className="p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Delete post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                )}

                {isEditing ? (
                    <div className="pr-12">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-4xl font-extrabold mb-3 p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-primary-deep dark:text-slate-100 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                            placeholder="Post title"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full text-lg leading-relaxed p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-text-dark dark:text-slate-100/90 resize-y min-h-[200px] focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                            placeholder="Post content"
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleSaveEdit}
                                disabled={editLoading}
                                className="px-4 py-2 rounded-md font-semibold bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                {editLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={editLoading}
                                className="px-4 py-2 rounded-md font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-4xl font-extrabold mb-3 text-primary-deep dark:text-slate-100 pr-12">
                            {post.title}
                        </h1>
                        <p className="text-sm mb-4 border-b border-gray-200 dark:border-slate-700 pb-4 text-gray-600 dark:text-gray-300">
                            Posted by{' '}
                            <button
                                onClick={() => setView('profile', null, post.author_username)}
                                className="font-semibold text-blue-medium dark:text-blue-accent hover:text-blue-dark dark:hover:text-blue-300 hover:underline transition-colors"
                            >
                                {post.author_username}
                            </button>
                            {' '}on {new Date(post.created_at).toLocaleDateString()}
                            {post.is_edited && (
                                <span className="ml-2 text-xs italic text-gray-500 dark:text-gray-400">
                                    (edited {post.edited_at ? new Date(post.edited_at).toLocaleDateString() : ''})
                                </span>
                            )}
                        </p>
                        <p className="text-lg leading-relaxed text-text-dark dark:text-slate-100/90 whitespace-pre-wrap">
                            {post.content}
                        </p>
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                confirmText={deleteLoading ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                danger={true}
            />

            {/* Comment Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-primary-deep">
                    Salaysay Comments ({post.comment_count || 0})
                </h2>

                {/* Comment Submission Form */}
                <form onSubmit={handleCommentSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg mb-6 border-2 border-blue-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-2 text-text-dark dark:text-slate-100">Your Salaysay</h3>
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={isLoggedIn ? "Share your thoughts or reply..." : "Log in to post a comment."}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-3 text-base focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition resize-none bg-white dark:bg-slate-700 text-text-dark dark:text-slate-100"
                        rows="4"
                        required
                        disabled={!isLoggedIn}
                    ></textarea>
                    <button
                        type="submit"
                        disabled={commentLoading || !isLoggedIn}
                        className="mt-3 py-2 px-6 rounded-full font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {commentLoading ? 'Submitting...' : 'Post Comment'}
                    </button>
                </form>

                {/* Comment List */}
                <div className="space-y-4">
                    {post.comments && post.comments.length > 0 ? (
                        post.comments.map(comment => (
                            <CommentItem 
                                key={comment.id} 
                                comment={comment} 
                                postId={post.id}
                                onCommentPosted={handleCommentPosted}
                            />
                        ))
                    ) : (
                        <div className="text-gray-500 italic p-4 text-center bg-white rounded-lg shadow-md border border-gray-200">
                            No comments yet. Be the first to share your Salaysay.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;