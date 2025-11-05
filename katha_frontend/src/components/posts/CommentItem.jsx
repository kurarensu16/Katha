import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../shared/ConfirmDialog';

// Component to handle recursion and reply forms
const CommentItem = ({ comment, postId, onCommentPosted, depth = 0 }) => {
    const { isLoggedIn, setView, APIService, user } = useAuth();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Voting state
    const initialScore = comment.votes || 0;
    const [score, setScore] = useState(initialScore);
    const initialUserVote = comment.user_vote !== undefined ? comment.user_vote : 0;
    const [userVote, setUserVote] = useState(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);

    // Update score and userVote when comment prop changes
    useEffect(() => {
        if (comment.votes !== undefined) {
            setScore(comment.votes);
        }
        if (comment.user_vote !== undefined) {
            setUserVote(comment.user_vote);
        }
    }, [comment.votes, comment.user_vote]);

    const isAuthor = user && comment.author_username === user.username;

    const handleEdit = () => {
        setIsEditing(true);
        setEditText(comment.text);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText(comment.text);
    };

    const handleSaveEdit = async () => {
        if (!editText.trim()) {
            alert('Comment cannot be empty');
            return;
        }

        setEditLoading(true);
        try {
            const response = await APIService.fetch(`comments/${comment.id}/`, {
                method: 'PUT',
                body: JSON.stringify({
                    text: editText.trim()
                })
            });

            if (response.ok) {
                setIsEditing(false);
                onCommentPosted(); // Trigger refresh
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to update comment' }));
                alert(errorData.error || 'Failed to update comment');
            }
        } catch (error) {
            alert('Network error when updating comment.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const response = await APIService.fetch(`comments/${comment.id}/`, {
                method: 'DELETE'
            });

            if (response.ok || response.status === 204) {
                onCommentPosted(); // Trigger refresh
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Failed to delete comment' }));
                alert(errorData.error || 'Failed to delete comment');
            }
        } catch (error) {
            alert('Network error when deleting comment.');
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    // Determines indentation level
    const paddingClass = depth > 0 ? `ml-6 border-l-2 pl-3 border-blue-medium dark:border-blue-accent` : 'mt-4'; 

    const handleVote = async (voteValue) => {
        if (!isLoggedIn) {
            alert('Please log in to vote');
            return;
        }

        if (isVoting) return; // Prevent double voting

        // Calculate what the new vote should be
        let newVote;
        if (userVote === voteValue) {
            // Clicking the same vote removes it (toggle off)
            newVote = 0;
        } else {
            // Clicking a different vote switches to that vote
            newVote = voteValue;
        }

        // Optimistic UI update
        const oldVote = userVote;
        const oldScore = score;
        
        // Calculate new score
        let newScore = oldScore;
        if (oldVote === 0) {
            // No previous vote, just add the new one
            newScore = oldScore + newVote;
        } else if (newVote === 0) {
            // Removing vote
            newScore = oldScore - oldVote;
        } else {
            // Changing vote
            newScore = oldScore - oldVote + newVote;
        }

        setScore(newScore);
        setUserVote(newVote);
        setIsVoting(true);

        try {
            const response = await APIService.fetch(`comments/${comment.id}/vote/`, {
                method: 'POST',
                body: JSON.stringify({ value: newVote })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to vote' }));
                throw new Error(errorData.error || 'Failed to vote');
            }

            const updatedComment = await response.json();
            // Update with server response
            setScore(updatedComment.votes);
            setUserVote(updatedComment.user_vote);
            // Trigger refresh to update parent
            onCommentPosted();
        } catch (error) {
            // Revert optimistic update on error
            console.error('Vote error:', error);
            setScore(oldScore);
            setUserVote(oldVote);
            alert(error.message || 'Failed to vote. Please try again.');
        } finally {
            setIsVoting(false);
        }
    };

    const handleUpvote = () => {
        handleVote(1);
    };

    const handleDownvote = () => {
        handleVote(-1);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert("You must log in to reply.");
            setView('login');
            return;
        }
        if (!replyText.trim()) return;

        setLoading(true);
        const newComment = {
            post: postId, 
            text: replyText,
            parent: comment.id, // Parent comment ID for the reply
        };

        try {
            const response = await APIService.fetch('comments/', {
                method: 'POST',
                body: JSON.stringify(newComment)
            });

            if (response.ok) {
                setReplyText('');
                setShowReplyForm(false);
                // Call the callback to trigger a data refresh in the parent PostDetail component
                onCommentPosted(); 
            } else {
                 alert('Failed to post reply. Ensure you are logged in and the API is running.');
            }
        } catch (error) {
            alert('Network error when posting reply.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className={`rounded-lg p-3 my-2 shadow-sm transition duration-150 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${depth > 0 ? 'border-l-blue-medium dark:border-l-blue-accent border-l-2' : ''}`}
        >
            <div className="flex gap-3">
                {/* Voting Column */}
                <div className="flex flex-col items-center justify-start pt-1">
                    <button 
                        onClick={handleUpvote} 
                        disabled={isVoting}
                        aria-label="Upvote comment" 
                        className={`transition duration-150 ${userVote === 1 ? 'text-blue-medium' : 'text-gray-600 dark:text-gray-300'} ${isVoting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-medium'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4L4 12H9V20H15V12H20L12 4Z" />
                        </svg>
                    </button>
                    <span className="font-bold text-sm my-1 text-blue-dark dark:text-white">{score}</span>
                    <button 
                        onClick={handleDownvote} 
                        disabled={isVoting}
                        aria-label="Downvote comment" 
                        className={`transition duration-150 rotate-180 ${userVote === -1 ? 'text-blue-medium' : 'text-gray-600 dark:text-gray-300'} ${isVoting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-medium'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4L4 12H9V20H15V12H20L12 4Z" />
                        </svg>
                    </button>
                </div>

                {/* Comment Content */}
                <div className={`flex-1 ${paddingClass}`}>
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <span className="font-semibold text-primary-deep dark:text-slate-100">{comment.author_username || 'Anonymous'}</span>
                            <span className="text-xs ml-2 text-gray-500 dark:text-gray-300">
                                {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {comment.is_edited && (
                                <span className="ml-2 text-xs italic text-gray-500 dark:text-gray-400">
                                    (edited {comment.edited_at ? new Date(comment.edited_at).toLocaleDateString() : ''})
                                </span>
                            )}
                        </div>
                        {/* Edit/Delete buttons for author */}
                        {isAuthor && !isEditing && (
                            <div className="flex gap-1">
                                <button
                                    onClick={handleEdit}
                                    className="p-1 rounded text-blue-medium dark:text-blue-accent hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Edit comment"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    aria-label="Delete comment"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {isEditing ? (
                        <div>
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full text-base p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-text-dark dark:text-slate-100/90 resize-y min-h-[80px] focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                                placeholder="Edit your comment..."
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={editLoading}
                                    className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    {editLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={editLoading}
                                    className="px-3 py-1 rounded-md text-xs font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-base break-words text-text-dark dark:text-slate-100/90 whitespace-pre-wrap mb-2">{comment.text}</p>
                    )}
                    
                    {/* Action Buttons */}
                    {!isEditing && (
                        <div className="flex items-center space-x-4 mt-2">
                            <button 
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="text-xs font-medium hover:underline transition duration-150 text-blue-medium dark:text-blue-accent"
                            >
                                {showReplyForm ? 'Cancel Reply' : 'Reply'}
                            </button>
                        </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm && (
                        <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={isLoggedIn ? "Your reply..." : "You must log in to reply."}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition resize-none bg-white dark:bg-slate-700 text-text-dark dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-300/70"
                                rows="2"
                                required
                                disabled={!isLoggedIn}
                            ></textarea>
                            <button
                                type="submit"
                                disabled={loading || !isLoggedIn}
                                className="py-1 px-3 rounded-full text-xs font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Posting...' : 'Post Reply'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Render Replies (Recursive Call) */}
            {/* We only render nested replies if the current comment has them */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="pl-3 mt-4 border-t border-gray-200 dark:border-slate-700 pt-2">
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            postId={postId}
                            onCommentPosted={onCommentPosted}
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmText={deleteLoading ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                danger={true}
            />
        </div>
    );
};

export default CommentItem;