import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PostMenu from './PostMenu';

const PostItem = ({ post }) => {
    const { setView, isLoggedIn, APIService } = useAuth();
    
    const initialScore = post.votes || post.vote_score || 0;
    const [score, setScore] = useState(initialScore);
    // userVote: 1 = upvoted, -1 = downvoted, 0 = none
    const initialUserVote = post.user_vote !== undefined ? post.user_vote : 0;
    const [userVote, setUserVote] = useState(initialUserVote);
    const [isVoting, setIsVoting] = useState(false);
    const commentCount = post.comment_count || 0;

    // Update score and userVote when post prop changes
    useEffect(() => {
        if (post.votes !== undefined) {
            setScore(post.votes);
        }
        if (post.user_vote !== undefined) {
            setUserVote(post.user_vote);
        }
    }, [post.votes, post.user_vote]);

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
            const response = await APIService.fetch(`posts/${post.id}/vote/`, {
                method: 'POST',
                body: JSON.stringify({ value: newVote })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to vote' }));
                throw new Error(errorData.error || 'Failed to vote');
            }

            const updatedPost = await response.json();
            // Update with server response
            setScore(updatedPost.votes);
            setUserVote(updatedPost.user_vote);
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


    return (
        <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition duration-300 overflow-visible border border-gray-100 dark:border-slate-700">
            
            <div className="flex flex-col items-center justify-start p-3 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700">
                <button 
                    onClick={handleUpvote} 
                    disabled={isVoting}
                    aria-label="Upvote" 
                    className={`transition duration-150 ${userVote === 1 ? 'text-blue-medium' : 'text-gray-600 dark:text-gray-300'} ${isVoting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-medium'}`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12 4L4 12H9V20H15V12H20L12 4Z" />
                    </svg>
                </button>
                <span className="vote-score font-bold text-lg my-1 text-blue-dark dark:text-white">{score}</span>
                <button 
                    onClick={handleDownvote} 
                    disabled={isVoting}
                    aria-label="Downvote" 
                    className={`transition duration-150 rotate-180 ${userVote === -1 ? 'text-blue-medium' : 'text-gray-600 dark:text-gray-300'} ${isVoting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-medium'}`}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12 4L4 12H9V20H15V12H20L12 4Z" />
                    </svg>
                </button>
            </div>

            <div 
                className="p-4 grow cursor-pointer hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition-colors relative" 
                onClick={() => setView('detail', post.id)} 
            >
                {/* 3-dot menu button */}
                <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <PostMenu post={post} />
                </div>

                <h3 className="text-xl font-bold mb-2 hover:text-blue-medium transition-colors text-primary-deep dark:text-slate-100 pr-8">
                    {post.title}
                </h3>
                <p className="text-sm mb-3 text-gray-600 dark:text-gray-300">
                    Submitted by{' '}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setView('profile', null, post.author_username);
                        }}
                        className="font-medium text-blue-medium hover:text-blue-dark dark:text-blue-accent dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                        {post.author_username}
                    </button>
                    {' '}on {new Date(post.created_at).toLocaleDateString()}
                </p>
                <p className="text-base line-clamp-2 text-text-dark dark:text-slate-100/90 mb-2">
                    {post.content}
                </p>
                
                <button 
                    className="mt-3 text-sm font-semibold hover:underline text-blue-medium"
                >
                    {commentCount} Comments
                </button>
            </div>
        </div>
    );
};

export default PostItem;