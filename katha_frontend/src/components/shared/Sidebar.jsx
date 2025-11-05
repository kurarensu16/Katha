import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Divider = () => <div className="my-3 border-t border-blue-100" />;

const Sidebar = ({ isOpen, onClose, setView, isLoggedIn }) => {
    const { setSearchTerm } = useAuth();
    const searchInputRef = useRef(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('katha:theme') || 'light');
    const [localSearchValue, setLocalSearchValue] = useState('');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('katha:theme', theme);
    }, [theme]);

    const handleSearchKey = (e) => {
        if (e.key === 'Enter') {
            const term = e.currentTarget.value.trim();
            setSearchTerm(term);
            setView('feed');
            onClose();
        }
    };

    const handleSearchChange = (e) => {
        setLocalSearchValue(e.target.value);
    };

    const quickDraft = () => {
        // Check if there's an existing draft
        try {
            const existingDraft = localStorage.getItem('katha:draft');
            if (existingDraft) {
                const draft = JSON.parse(existingDraft);
                if (draft.title || draft.content) {
                    // There's a saved draft, load it
                    setView('create');
                } else {
                    // Empty draft, start fresh
                    setView('create');
                }
            } else {
                // No draft exists, start fresh
                localStorage.setItem('katha:draft', JSON.stringify({ title: '', content: '' }));
                setView('create');
            }
        } catch {
            // Error parsing, start fresh
            localStorage.setItem('katha:draft', JSON.stringify({ title: '', content: '' }));
            setView('create');
        }
    };

    return (
        <aside
            className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 bg-white dark:bg-slate-800 border-r border-blue-200 dark:border-slate-700 shadow-xl transition-[width,transform] duration-300 ease-out overflow-hidden ${
                isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'
            } sidebar-root`}
            aria-hidden={!isOpen}
        >
            <div className="h-full flex flex-col text-text-dark dark:text-white">
                <div className="px-4 py-3 border-b border-blue-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-deep dark:text-white">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-blue-50 text-blue-medium"
                        aria-label="Close sidebar"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                </div>

                <div className="p-3">
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={localSearchValue}
                            onChange={handleSearchChange}
                            placeholder="Search (Ctrl+K)"
                            onKeyDown={handleSearchKey}
                            className="w-full rounded-md border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-text-dark dark:text-white px-9 py-2 text-sm focus:ring-2 focus:ring-blue-medium focus:border-blue-medium placeholder:text-gray-400 dark:placeholder:text-gray-300/70"
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 text-blue-medium"><path d="M21 21L15.803 15.803M18 10.5C18 14.0899 15.0899 17 11.5 17C7.91015 17 5 14.0899 5 10.5C5 6.91015 7.91015 4 11.5 4C15.0899 4 18 6.91015 18 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                </div>

                <nav className="px-2 space-y-1 text-sm">
                    <button onClick={() => setView('feed')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M3 12L12 3L21 12V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Feed
                    </button>
                    <button onClick={() => { setView('saved'); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Saved
                    </button>
                    <button onClick={() => { setView('myPosts'); onClose(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M15 17H19M5 7H19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        My Posts
                    </button>

                    {isLoggedIn ? (
                        <>
                            <button onClick={() => setView('create')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                New Katha
                            </button>
                            <button onClick={quickDraft} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M4 5H14C15.1046 5 16 5.89543 16 7V19L12 17L8 19L4 17V7C4 5.89543 4.89543 5 6 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                Quick Draft
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setView('login')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M15 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 17L14 13L10 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Log In
                            </button>
                            <button onClick={() => setView('register')} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-medium dark:text-white"><path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="9" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                                Register
                            </button>
                        </>
                    )}
                </nav>

                <Divider />

                <div className="px-3 text-xs text-gray-600 dark:text-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary-deep dark:text-white">Appearance</span>
                        <button
                            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                            className="px-3 py-1 rounded-md bg-blue-50 text-blue-medium hover:bg-blue-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 border border-blue-100 dark:border-slate-600"
                        >
                            {theme === 'light' ? 'Dark' : 'Light'}
                        </button>
                    </div>

                    <p className="text-gray-500">Press Esc to close</p>
                </div>

                <div className="mt-auto p-3 border-t border-blue-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                        <span>© {new Date().getFullYear()} Katha</span>
                        <button
                            onClick={() => { setView('feedback'); onClose(); }}
                            className="text-blue-medium dark:text-blue-accent hover:underline"
                        >
                            Feedback
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;


