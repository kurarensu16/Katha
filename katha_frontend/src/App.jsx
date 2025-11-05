import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components and Pages
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import FeedPage from './pages/FeedPage';
import AuthPage from './pages/AuthPage';
import CreatePage from './pages/CreatePage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MyPostsPage from './pages/MyPostsPage';
import SavedPage from './pages/SavedPage';
import FeedbackPage from './pages/FeedbackPage';
import NotificationsPage from './pages/NotificationsPage';


const Router = () => {
    const { currentView, currentPostId } = useAuth();
    
    let content;
    
    // Main Content Area Routing
    switch (currentView) {
        case 'login':
        case 'register':
            content = <AuthPage type={currentView} />;
            break;
        case 'create':
            content = <CreatePage />; // Now routes to the CreatePost form
            break;
        case 'detail':
            // Routes to Post Detail, passing the ID from the context
            content = <PostDetailPage postId={currentPostId} />; 
            break;
        case 'profile':
            content = <ProfilePage />;
            break;
        case 'settings':
            content = <SettingsPage />;
            break;
        case 'myPosts':
            content = <MyPostsPage />;
            break;
        case 'saved':
            content = <SavedPage />;
            break;
        case 'feedback':
            content = <FeedbackPage />;
            break;
        case 'notifications':
            content = <NotificationsPage />;
            break;
        case 'feed':
        default:
            content = <FeedPage />;
    }

    return (
        <div className="pt-20 min-h-screen" style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-text)' }}>
            <div className="max-w-7xl mx-auto">
                {content}
            </div>
        </div>
    );
};

const AppShell = () => {
    const { isLoggedIn, setView } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        try { return JSON.parse(localStorage.getItem('katha:sidebar-open') || 'false'); } catch { return false; }
    });

    const handleToggleSidebar = () => setIsSidebarOpen((v) => !v);
    const handleCloseSidebar = () => setIsSidebarOpen(false);

    React.useEffect(() => {
        localStorage.setItem('katha:sidebar-open', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    React.useEffect(() => {
        const onKey = (e) => {
            // Ctrl+K focuses global search (Navbar input)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                // Dispatch a custom event so Navbar can focus its search input
                window.dispatchEvent(new CustomEvent('focus-global-search'));
            }
            if (e.key === 'Escape') {
                setIsSidebarOpen(false);
            }
            // Ctrl+B toggles sidebar
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setIsSidebarOpen((v) => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const contentPaddingClass = useMemo(() => (isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'), [isSidebarOpen]);

    return (
        <div id="katha-app" className={`min-h-screen transition-colors ${contentPaddingClass}`}>
            <Navbar onToggleSidebar={handleToggleSidebar} />
            <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} setView={setView} isLoggedIn={isLoggedIn} />
            <Router />
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <AppShell />
    </AuthProvider>
);

export default App;