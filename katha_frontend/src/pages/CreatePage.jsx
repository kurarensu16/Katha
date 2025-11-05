import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CreatePage = () => {
    const { isLoggedIn, setView, APIService } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDraft, setIsDraft] = useState(false);

    // Load draft from localStorage on mount
    useEffect(() => {
        try {
            const draftData = localStorage.getItem('katha:draft');
            if (draftData) {
                const draft = JSON.parse(draftData);
                if (draft.title || draft.content) {
                    setTitle(draft.title || '');
                    setContent(draft.content || '');
                    setIsDraft(true);
                }
            }
        } catch (err) {
            console.error('Failed to load draft:', err);
        }
    }, []);

    // Auto-save draft as user types
    useEffect(() => {
        if (isDraft || title || content) {
            const draftData = { title, content };
            localStorage.setItem('katha:draft', JSON.stringify(draftData));
        }
    }, [title, content, isDraft]);

    if (!isLoggedIn) {
        return (
            <div className="max-w-md mx-auto p-10 mt-10 text-center rounded-lg shadow-xl bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-primary-deep dark:text-slate-100">Access Denied</h2>
                <p className="mb-6 text-text-dark dark:text-gray-300">You must be logged in to submit a Katha.</p>
                <button
                    onClick={() => setView('login')}
                    className="px-6 py-2 rounded-full font-semibold transition duration-200 bg-blue-medium text-white hover:bg-blue-dark"
                >
                    Log In Now
                </button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const newPost = {
            title,
            content,
            // The 'author' field is set automatically by the Django view's perform_create method
        };

        try {
            const response = await APIService.fetch('posts/', {
                method: 'POST',
                body: JSON.stringify(newPost)
            });

            if (response.ok) {
                const data = await response.json();
                // Clear draft after successful submission
                localStorage.removeItem('katha:draft');
                alert('Katha submitted successfully!');
                // Redirect user to the detail page of the new post
                setView('detail', data.id); 
            } else {
                const errorData = await response.json();
                setError("Failed to submit post. Check form data or API status.");
                console.error("Post creation error:", errorData);
            }
        } catch (err) {
            setError("Network error: Could not connect to API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary-deep dark:text-slate-100 bg-gradient-to-r from-blue-dark to-blue-medium bg-clip-text text-transparent">
                    {isDraft ? 'Continue Your Draft' : 'Submit Your Katha'}
                </h2>
                {isDraft && (
                    <button
                        onClick={() => {
                            if (confirm('Clear draft and start fresh?')) {
                                localStorage.removeItem('katha:draft');
                                setTitle('');
                                setContent('');
                                setIsDraft(false);
                            }
                        }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                        Clear Draft
                    </button>
                )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-2xl border-2 border-blue-200 dark:border-slate-700">
                {isDraft && (
                    <div className="mb-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-100 text-sm font-medium flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 dark:text-blue-300">
                            <path d="M4 5H14C15.1046 5 16 5.89543 16 7V19L12 17L8 19L4 17V7C4 5.89543 4.89543 5 6 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 9H11M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Draft restored - Your work has been auto-saved
                    </div>
                )}
                {error && (
                    <div className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded text-sm mb-4">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title your creation (Max 200 chars)"
                            className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                            maxLength="200"
                            required
                        />
                        <p className="text-xs text-blue-medium dark:text-blue-accent mt-1">{title.length}/200 characters</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-text-dark dark:text-gray-300">Content / Narrative</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="10"
                            placeholder="Write your narrative (salaysay) or paste the link content here..."
                            className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium resize-none transition bg-white dark:bg-slate-700 text-text-dark dark:text-white"
                            required
                        ></textarea>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-md font-semibold text-lg transition duration-300 shadow-md transform hover:scale-[1.01] bg-blue-medium text-white hover:bg-blue-dark disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Publish Katha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePage;