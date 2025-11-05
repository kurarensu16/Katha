import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FeedbackPage = () => {
    const { user, isLoggedIn, setView, APIService } = useAuth();
    const [feedbackType, setFeedbackType] = useState('general');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!message.trim()) {
            setError('Please provide a message.');
            setLoading(false);
            return;
        }

        try {
            const response = await APIService.fetch('feedback/', {
                method: 'POST',
                body: JSON.stringify({
                    type: feedbackType,
                    subject: subject.trim().slice(0, 100) || 'General Feedback',
                    message: message.trim(),
                    email: (isLoggedIn ? (user?.email || '') : (email || '')).trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to submit feedback' }));
                throw new Error(errorData.error || 'Failed to submit feedback');
            }

            setSuccess(true);
            setSubject('');
            setMessage('');
            if (!isLoggedIn) {
                setEmail('');
            }
            
            // Reset success message after 5 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 5000);
        } catch (err) {
            setError(err.message || 'Failed to submit feedback. Please try again.');
            console.error('Feedback submission error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <button
                onClick={() => setView('feed')}
                className="mb-4 text-sm font-medium hover:underline flex items-center transition duration-150 text-blue-medium dark:text-blue-accent"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Feed
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                <h1 className="text-3xl font-bold mb-2 text-primary-deep dark:text-slate-100">
                    Send Feedback
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We'd love to hear your thoughts, suggestions, or report any issues you've encountered. (Feedback is currently not implemented.)
                </p>

                {success && (
                    <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300">
                        <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-medium">Thank you! Your feedback has been submitted successfully.</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                            Feedback Type
                        </label>
                        <select
                            value={feedbackType}
                            onChange={(e) => setFeedbackType(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                        >
                            <option value="general">General Feedback</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="improvement">Improvement Suggestion</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                            Subject <span className="text-gray-500 dark:text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of your feedback"
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                            maxLength="100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="8"
                            placeholder="Please share your thoughts, describe any issues, or suggest improvements..."
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition resize-none bg-white dark:bg-slate-700 text-text-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300/70"
                            required
                        ></textarea>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {message.length} characters
                        </p>
                    </div>

                    {!isLoggedIn && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">
                                Email <span className="text-gray-500 dark:text-gray-400">(Optional, for follow-up)</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                            />
                        </div>
                    )}

                    {isLoggedIn && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Submitting as: <span className="font-medium text-primary-deep dark:text-slate-100">{user?.username}</span></p>
                            {user?.email && (
                                <p className="text-xs mt-1">Email: {user.email}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="px-6 py-3 rounded-md font-semibold transition duration-300 shadow-md bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSubject('');
                                setMessage('');
                                setFeedbackType('general');
                                if (!isLoggedIn) setEmail('');
                            }}
                            className="px-6 py-3 rounded-md font-semibold transition duration-200 border border-gray-300 dark:border-slate-600 text-text-dark dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Clear
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Note:</strong> Your feedback helps us improve Katha. We read every submission and appreciate your time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;

