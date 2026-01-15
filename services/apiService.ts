const getBaseUrl = () => {
    // If explicitly configured via environment variable, use that
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const host = window.location.hostname;
    const protocol = window.location.protocol; // 'http:' or 'https:'

    // Check if running on a public domain (not localhost or local IP)
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isLocalIP = /^192\.168\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host);

    if (isLocalhost || isLocalIP) {
        // Local development: use http://hostname:5000/api
        return `http://${host}:5000/api`;
    } else {
        // Production fallback: This should NOT be used if VITE_API_URL is set
        // Only here as a last resort
        console.warn('⚠️ VITE_API_URL not set! Using same domain fallback which may not work.');
        return `${protocol}//${host}/api`;
    }
};

const API_BASE = getBaseUrl();

/* ==================== Interfaces ==================== */

export interface User {
    id: string;
    name: string;
    phone: string;
    isAdmin?: boolean;
}

export interface Mosque {
    id: string;
    name: string;
    location: string;
    lat?: number;
    lng?: number;
}

export interface Lesson {
    id?: string;
    title: string;
    date: string;
    mosqueId: string;
}

export interface Post {
    id?: string;
    content: string;
    userId: string;
    mosqueId?: string;
}

export interface Ticket {
    id?: string;
    title: string;
    description: string;
    status?: 'open' | 'closed';
}

/* ==================== API Service ==================== */

class APIService {
    /* ---------- Helpers ---------- */

    private static getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    public static async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders()
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'API Error');
        }

        return response.json();
    }

    /* ==================== Users ==================== */

    static loginUser(name: string, phone: string, isAdmin = false) {
        return this.request<User>('/users/login', {
            method: 'POST',
            body: JSON.stringify({ name, phone, isAdmin })
        });
    }

    static registerUser(name: string, phone: string) {
        return this.request<User>('/users/register', {
            method: 'POST',
            body: JSON.stringify({ name, phone })
        });
    }

    static getUser(id: string) {
        return this.request<User>(`/users/${id}`);
    }

    static updateUser(user: User) {
        return this.request<User>(`/users/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify(user)
        });
    }

    static getAllUsers() {
        return this.request<User[]>('/users');
    }

    /* ==================== Mosques ==================== */

    static createMosque(mosque: Mosque) {
        return this.request<Mosque>('/mosques', {
            method: 'POST',
            body: JSON.stringify(mosque)
        });
    }

    static getMosques() {
        return this.request<Mosque[]>('/mosques');
    }

    static updateMosque(mosque: Mosque) {
        return this.request<Mosque>(`/mosques/${mosque.id}`, {
            method: 'PUT',
            body: JSON.stringify(mosque)
        });
    }

    /* ==================== Lessons ==================== */

    static createLesson(lesson: Lesson) {
        return this.request<Lesson>('/lessons', {
            method: 'POST',
            body: JSON.stringify(lesson)
        });
    }

    static getLessons() {
        return this.request<Lesson[]>('/lessons');
    }

    /* ==================== Posts ==================== */

    static createPost(post: Post) {
        return this.request<Post>('/posts', {
            method: 'POST',
            body: JSON.stringify(post)
        });
    }

    static getPosts() {
        return this.request<Post[]>('/posts');
    }

    static updatePost(post: Post) {
        return this.request<Post>(`/posts/${post.id}`, {
            method: 'PUT',
            body: JSON.stringify(post)
        });
    }

    /* ==================== Post Likes ==================== */

    static likePost(postId: string, userId: string) {
        return this.request(`/posts/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    static unlikePost(postId: string, userId: string) {
        return this.request(`/posts/${postId}/like`, {
            method: 'DELETE',
            body: JSON.stringify({ userId })
        });
    }

    static getPostLikes(postId: string) {
        return this.request<number>(`/posts/${postId}/likes`);
    }

    static hasUserLiked(postId: string, userId: string) {
        return this.request<{ liked: boolean }>(
            `/posts/${postId}/liked/${userId}`
        );
    }

    /* ==================== Educational Lessons & Certificates ==================== */

    static checkCategoryCompletion(userId: string, category: string) {
        return this.request<{ isCompleted: boolean; totalLessons: number; completedLessons: number }>(
            `/educational-lessons/completion/${category}?userId=${userId}`
        );
    }

    static submitLessonQuiz(userId: string, lessonId: string, answers: any[]) {
        return this.request<{
            success: boolean;
            passed: boolean;
            score: number;
            total: number;
            nextLessonUnlocked: boolean;
            nextLesson: any;
        }>(`/educational-lessons/${lessonId}/submit-quiz`, { // Fixed URL path
            method: 'POST',
            body: JSON.stringify({ userId, answers })
        });
    }

    /* ==================== Comments ==================== */

    static addComment(postId: string, comment: { userId: string; content: string; parentId?: string; userName?: string; id?: string }) {
        return this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify(comment)
        });
    }

    static getComments(postId: string) {
        return this.request(`/posts/${postId}/comments`);
    }

    static deleteComment(commentId: string) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE'
        });
    }

    static editComment(commentId: string, content: string) {
        return this.request(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });
    }

    /* ==================== Shares ==================== */

    static sharePost(postId: string, userId: string) {
        return this.request(`/posts/${postId}/share`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    static getShareCount(postId: string) {
        return this.request<number>(`/posts/${postId}/shares`);
    }

    static getShareUrl(postId: string) {
        return this.request<{ shareUrl: string; postId: string }>(`/posts/${postId}/share-url`);
    }

    /* ==================== Prayer Logs ==================== */

    static savePrayerLog(log: {
        userId: string;
        date: string;
        fajr: boolean;
        dhuhr: boolean;
        asr: boolean;
        maghrib: boolean;
        isha: boolean;
    }) {
        return this.request('/prayer-logs', {
            method: 'POST',
            body: JSON.stringify(log)
        });
    }

    static savePost(postId: string, userId: string) {
        return this.request(`/posts/${postId}/favorite`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    static unsavePost(postId: string, userId: string) {
        return this.request(`/posts/${postId}/unfavorite`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    static getSavedPosts(userId: string) {
        return this.request<any[]>(`/users/${userId}/favorites`);
    }

    static hasUserSaved(postId: string, userId: string) {
        return this.request<{ favorited: boolean }>(`/posts/${postId}/favorited/${userId}`);
    }


    static getPrayerLog(userId: string, date: string) {
        return this.request(`/prayer-logs/${userId}/${date}`);
    }

    /* ==================== Tasbih ==================== */

    static saveTasbihLog(
        userId: string,
        phrase: string,
        count: number,
        lifetimeCount: number
    ) {
        return this.request('/tasbih-logs', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                phrase,
                count,
                lifetimeCount
            })
        });
    }

    static getTasbihLog(userId: string, date: string) {
        return this.request(`/tasbih-logs/${userId}/${date}`);
    }

    static getTasbihCount(userId: string) {
        return this.request<{ count: number }>(
            `/tasbih-count/${userId}`
        ).then(res => res.count);
    }

    /* ==================== Khatma ==================== */

    static getKhatma() {
        return this.request('/khatma');
    }

    static updateKhatma(khatma: { id: string;[key: string]: any }) {
        return this.request(`/khatma/${khatma.id}`, {
            method: 'PUT',
            body: JSON.stringify(khatma)
        });
    }

    /* ==================== Tickets ==================== */

    static createTicket(ticket: Ticket) {
        return this.request<Ticket>('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticket)
        });
    }

    static getTickets() {
        return this.request<Ticket[]>('/tickets');
    }

    static updateTicket(ticket: Ticket) {
        return this.request<Ticket>(`/tickets/${ticket.id}`, {
            method: 'PUT',
            body: JSON.stringify(ticket)
        });
    }

    /* ==================== Post Management ==================== */

    static deletePost(postId: string) {
        return this.request(`/posts/${postId}`, {
            method: 'DELETE'
        });
    }

    /* ==================== Assistant Logs ==================== */

    static addAssistantLog(log: { id?: string; userId?: string; query: string; source: string; snippet?: string; success?: boolean }) {
        return this.request('/assistant/logs', {
            method: 'POST',
            body: JSON.stringify(log)
        });
    }

    static getAssistantLogs(userId?: string) {
        const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return this.request(`/assistant/logs${q}`);
    }

    static editPost(postId: string, content: string) {
        return this.request(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content })
        });
    }

    /* ==================== Notifications ==================== */

    static createNotification(notification: {
        id: string;
        userId: string;
        fromUserId?: string;
        type: string;
        postId?: string;
        content?: string;
    }) {
        return this.request('/notifications', {
            method: 'POST',
            body: JSON.stringify(notification)
        });
    }

    static getNotifications(userId: string) {
        return this.request(`/notifications/${userId}`);
    }

    static markNotificationAsRead(notificationId: string) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
    }

    /* ==================== Health ==================== */

    static async checkHealth(): Promise<boolean> {
        try {
            await this.request('/health');
            return true;
        } catch {
            return false;
        }
    }
}

export default APIService;
