// Base URL for the Django API (should end with /api/v1/)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
// Auth endpoints live at /api/token/, not /api/v1/token/
const API_AUTH_BASE_URL = API_BASE_URL.replace(/v1\/?$/, '');

const APIService = {
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_AUTH_BASE_URL}token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData };
            }

            const data = await response.json();
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            return { success: true, access: data.access };

        } catch (error) {
            console.error("Login API Error:", error);
            return { success: false, error: "Network error during login." };
        }
    },

    refreshToken: async () => {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) return null;

        try {
            const response = await fetch(`${API_AUTH_BASE_URL}token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });

            if (!response.ok) {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                return null;
            }

            const data = await response.json();
            localStorage.setItem('access', data.access);
            return data.access;
        } catch (error) {
            console.error("Token refresh failed:", error);
            return null;
        }
    },

    fetch: async (endpoint, options = {}) => {
        let access = localStorage.getItem('access');
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (access) {
            headers['Authorization'] = `Bearer ${access}`;
        }

        let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401 && access) {
            const newAccess = await APIService.refreshToken();
            if (newAccess) {
                headers['Authorization'] = `Bearer ${newAccess}`;
                response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
            }
        }

        return response;
    },
};

export default APIService;