import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PostItem from '../components/posts/PostItem';

const mockPosts = [
    { id: 1, title: "Welcome to Katha: Bawat salaysay, may puwang.", content: "This is the first post on your new community platform. Try registering a user and logging in!", author_username: "Admin", created_at: new Date().toISOString(), votes: 10, comment_count: 5 },
    { id: 2, title: "Thoughts on the Baybayin Blue Theme?", content: "I love the deep blue and teal accent. It gives the platform a clean, serious, yet modern look. What do you think?", author_username: "Developer", created_at: new Date(Date.now() - 86400000).toISOString(), votes: 15, comment_count: 8 },
];

const FeedPage = () => {
    const { APIService, searchTerm, setSearchTerm } = useAuth();
    const [posts, setPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Sorting and filtering state
    const [sortBy, setSortBy] = useState('newest');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Build query parameters
                const params = new URLSearchParams();
                if (sortBy) params.append('sort', sortBy);
                if (filterAuthor) params.append('author', filterAuthor);
                if (dateFrom) params.append('date_from', dateFrom);
                if (dateTo) params.append('date_to', dateTo);
                
                const queryString = params.toString();
                const url = queryString ? `posts/?${queryString}` : 'posts/';
                
                const response = await APIService.fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    const fetchedPosts = data.length > 0 ? data : mockPosts;
                    setAllPosts(fetchedPosts);
                    setError(null);
                } else {
                    console.error("Failed to fetch posts:", response.status);
                    setAllPosts(mockPosts); 
                    setError("Could not connect to Django API or API error. Showing mock data.");
                }
            } catch (err) {
                console.error("Network or parsing error:", err);
                setAllPosts(mockPosts);
                setError("The backend API is currently not available and will be moved to a different host soon. Showing mock data.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [APIService, sortBy, filterAuthor, dateFrom, dateTo]);

    // Filter posts based on search term
    const filteredPosts = useMemo(() => {
        if (!searchTerm.trim()) {
            return allPosts;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        return allPosts.filter(post => {
            const titleMatch = post.title?.toLowerCase().includes(searchLower);
            const contentMatch = post.content?.toLowerCase().includes(searchLower);
            const authorMatch = post.author_username?.toLowerCase().includes(searchLower);
            return titleMatch || contentMatch || authorMatch;
        });
    }, [allPosts, searchTerm]);

    useEffect(() => {
        setPosts(filteredPosts);
    }, [filteredPosts]);

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleClearFilters = () => {
        setFilterAuthor('');
        setDateFrom('');
        setDateTo('');
        setSortBy('newest');
    };

    const hasActiveFilters = filterAuthor || dateFrom || dateTo || sortBy !== 'newest';

    if (loading) {
        return (
            <div className="text-center p-10 text-xl text-primary-deep dark:text-blue-accent">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-medium dark:border-blue-accent mr-3"></div>
                Loading Katha Feed...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold border-b-2 border-blue-200 dark:border-slate-700 pb-3 bg-gradient-to-r from-blue-dark to-blue-medium bg-clip-text text-transparent dark:from-blue-accent dark:to-blue-medium">
                    {searchTerm ? `Search Results` : `Global Feed`}
                </h2>
                <div className="flex items-center gap-2">
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-medium dark:hover:text-blue-accent flex items-center gap-1 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Clear Search
                        </button>
                    )}
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-medium dark:hover:text-blue-accent flex items-center gap-1 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Sorting and Filtering Controls */}
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sort by:
                        </label>
                        <select
                            id="sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="most_voted">Most Voted</option>
                            <option value="most_comments">Most Comments</option>
                            <option value="trending">Trending</option>
                        </select>
                    </div>

                    {/* Toggle Filters Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H21M7 12H17M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Filters
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Author Filter */}
                            <div>
                                <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Author
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    value={filterAuthor}
                                    onChange={(e) => setFilterAuthor(e.target.value)}
                                    placeholder="Filter by author..."
                                    className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                                />
                            </div>

                            {/* Date From */}
                            <div>
                                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-medium focus:border-blue-medium"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {searchTerm && (
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Showing results for: <span className="font-semibold">"{searchTerm}"</span> ({posts.length} {posts.length === 1 ? 'result' : 'results'})
                    </p>
                </div>
            )}
            
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
                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
                            {searchTerm 
                                ? `No posts found matching "${searchTerm}"`
                                : "No posts yet. Be the first to share your Katha!"
                            }
                        </p>
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="mt-4 px-4 py-2 rounded-full text-sm font-medium bg-blue-medium text-white hover:bg-blue-dark transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPage;