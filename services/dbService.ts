import { User, Mosque, Lesson, Post, SupportTicket, PrayerLog, Khatma } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============= Database Initialization =============
export const initDB = async () => {
    try {
        // Verify backend connection
        const response = await fetch(`${API_BASE}/posts`);
        if (!response.ok) {
            throw new Error('Backend not available');
        }
        console.log('✅ Connected to backend database');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to backend:', error);
        throw error;
    }
};

// ============= API Helper =============
const apiCall = async (method: string, endpoint: string, body?: any) => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        console.log(`API Call: ${method} ${API_BASE}${endpoint}`, body);
        const response = await fetch(`${API_BASE}${endpoint}`, options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error response:`, errorText);
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`API Response:`, data);
        return data;
    } catch (error: any) {
        console.error(`API call failed: ${method} ${endpoint}`, error);
        console.error(`Error details:`, error.message);
        throw error;
    }
};

// ============= Database Queries =============

export const dbQueries = {
    // ---- USERS ----
    getUsers: async () => {
        try {
            return await apiCall('GET', '/users');
        } catch {
            return [];
        }
    },

    getUser: async (id: string): Promise<User | null> => {
        return await apiCall('GET', `/users/${id}`);
    },

    getFullProfile: async (id: string) => {
        return await apiCall('GET', `/users/${id}/full-profile`);
    },

    getUserByPhone: async (phone: string) => {
        try {
            const users = await apiCall('GET', '/users');
            return users.find((u: User) => u.phone === phone) || null;
        } catch {
            return null;
        }
    },

    addUser: async (user: User) => {
        return await apiCall('POST', '/users/register', {
            name: user.name,
            phone: user.phone,
            role: user.role,
            managedMosqueId: user.managedMosqueId
        });
    },

    updateUser: async (user: User) => {
        return await apiCall('PUT', `/users/${user.id}`, user);
    },

    deleteUser: async (id: string) => {
        try {
            return await apiCall('DELETE', `/users/${id}`, {});
        } catch {
            return null;
        }
    },

    // ---- MOSQUES ----
    getMosques: async () => {
        try {
            return await apiCall('GET', '/mosques');
        } catch {
            return [];
        }
    },

    addMosque: async (mosque: Mosque) => {
        return await apiCall('POST', '/mosques', {
            id: mosque.id,
            name: mosque.name,
            imamName: mosque.imamName,
            address: mosque.address,
            phone: mosque.phone,
            location: mosque.location,
            image: mosque.image,
            amenities: mosque.amenities
        });
    },

    updateMosque: async (mosque: Mosque) => {
        return await apiCall('PUT', `/mosques/${mosque.id}`, {
            id: mosque.id,
            name: mosque.name,
            imamName: mosque.imamName,
            address: mosque.address,
            phone: mosque.phone,
            location: mosque.location,
            image: mosque.image,
            followersCount: mosque.followersCount,
            amenities: mosque.amenities
        });
    },

    // ---- LESSONS ----
    getLessons: async () => {
        try {
            return await apiCall('GET', '/lessons');
        } catch {
            return [];
        }
    },

    addLesson: async (lesson: Lesson) => {
        return await apiCall('POST', '/lessons', {
            id: lesson.id,
            mosqueId: lesson.mosqueId,
            title: lesson.title,
            sheikhName: lesson.sheikhName,
            date: lesson.date,
            time: lesson.time,
            type: lesson.type,
            description: lesson.description
        });
    },

    // ---- POSTS ----
    getPosts: async () => {
        try {
            return await apiCall('GET', '/posts');
        } catch {
            return [];
        }
    },

    addPost: async (post: Post) => {
        return await apiCall('POST', '/posts', {
            id: post.id,
            mosqueId: post.mosqueId,
            content: post.content,
            image: post.image,
            videoUrl: post.videoUrl,
            likes: post.likes || 0,
            comments: post.comments || [],
            createdAt: post.createdAt,
            type: post.type
        });
    },

    updatePost: async (post: Post) => {
        return await apiCall('PUT', `/posts/${post.id}`, {
            id: post.id,
            mosqueId: post.mosqueId,
            content: post.content,
            image: post.image,
            videoUrl: post.videoUrl,
            likes: post.likes || 0,
            comments: post.comments || [],
            type: post.type
        });
    },

    deletePost: async (postId: string) => {
        try {
            return await apiCall('DELETE', `/posts/${postId}`, {});
        } catch {
            return null;
        }
    },

    editPost: async (postId: string, content: string) => {
        try {
            return await apiCall('PUT', `/posts/${postId}/edit`, { content });
        } catch {
            return null;
        }
    },

    // ---- SUPPORT TICKETS ----
    getTickets: async () => {
        try {
            return await apiCall('GET', '/support/tickets');
        } catch {
            return [];
        }
    },

    addTicket: async (ticket: SupportTicket) => {
        return await apiCall('POST', '/support/tickets', {
            id: ticket.id,
            userId: ticket.userId,
            userName: ticket.userName,
            subject: ticket.subject,
            message: ticket.message,
            status: ticket.status || 'open',
            createdAt: ticket.createdAt
        });
    },

    updateTicket: async (ticket: SupportTicket) => {
        return await apiCall('PUT', `/support/tickets/${ticket.id}`, {
            reply: ticket.reply,
            status: ticket.status
        });
    },

    // ---- PRAYER LOGS ----
    getPrayerLog: async (userId: string, date: string): Promise<PrayerLog | null> => {
        try {
            return await apiCall('GET', `/prayer-logs/${userId}/${date}`);
        } catch {
            return null;
        }
    },

    updatePrayerLog: async (log: PrayerLog) => {
        return await apiCall('POST', `/prayer-logs`, {
            userId: log.userId,
            date: log.date,
            fajr: log.fajr,
            dhuhr: log.dhuhr,
            asr: log.asr,
            maghrib: log.maghrib,
            isha: log.isha
        });
    },

    // ---- KHATMA ----
    getKhatma: async () => {
        try {
            return await apiCall('GET', '/khatma');
        } catch {
            return null;
        }
    },

    updateKhatma: async (khatma: Khatma) => {
        return await apiCall('PUT', `/khatma/${khatma.id}`, {
            completedParts: khatma.completedParts,
            participants: khatma.participants
        });
    },

    // ---- TASBIH LOGS ----
    saveTasbihLog: async (userId: string, phrase: string, count: number, target: number, completed: boolean) => {
        return await apiCall('POST', '/tasbih-logs', {
            userId,
            phrase,
            count,
            target,
            completed,
            date: new Date().toISOString().split('T')[0]
        });
    },

    getTasbihLog: async (userId: string, date: string) => {
        try {
            return await apiCall('GET', `/tasbih-logs/${userId}/${date}`);
        } catch {
            return null;
        }
    },

    getRecentTasbihLogs: async (userId: string, limit: number) => {
        try {
            return await apiCall('GET', `/tasbih-logs/recent/${userId}?limit=${limit}`);
        } catch {
            return [];
        }
    },

    clearTasbihLogs: async (userId: string) => {
        try {
            return await apiCall('DELETE', `/tasbih-logs/clear/${userId}`, {});
        } catch {
            return false;
        }
    },

    getTotalTasbihCount: async (userId: string): Promise<number> => {
        try {
            const result = await apiCall('GET', `/tasbih/total/${userId}`);
            return result?.total || 0;
        } catch {
            return 0;
        }
    },

    // ---- POST LIKES ----
    addPostLike: async (postId: string, userId: string) => {
        return await apiCall('POST', `/posts/${postId}/like`, { userId });
    },

    removePostLike: async (postId: string, userId: string) => {
        return await apiCall('POST', `/posts/${postId}/unlike`, { userId });
    },

    getPostLikesCount: async (postId: string): Promise<number> => {
        try {
            const result = await apiCall('GET', `/posts/${postId}/likes`);
            return result?.count || result || 0;
        } catch {
            return 0;
        }
    },

    hasUserLiked: async (postId: string, userId: string): Promise<boolean> => {
        try {
            const result = await apiCall('GET', `/posts/${postId}/like/${userId}`);
            return result?.liked || false;
        } catch {
            return false;
        }
    },

    // ---- POST COMMENTS ----
    addPostComment: async (comment: any) => {
        return await apiCall('POST', `/posts/${comment.postId}/comments`, {
            id: comment.id,
            userId: comment.userId,
            userName: comment.userName,
            content: comment.content,
            parentId: comment.parentId || null,
            createdAt: comment.createdAt
        });
    },

    getPostComments: async (postId: string) => {
        try {
            return await apiCall('GET', `/posts/${postId}/comments`);
        } catch {
            return [];
        }
    },

    deletePostComment: async (postId: string, commentId: string) => {
        return await apiCall('DELETE', `/posts/${postId}/comments/${commentId}`, {});
    },

    // ---- POST SHARES ----
    addPostShare: async (postId: string, userId: string) => {
        return await apiCall('POST', `/posts/${postId}/share`, { userId });
    },

    getShareCount: async (postId: string): Promise<number> => {
        try {
            const result = await apiCall('GET', `/posts/${postId}/shares`);
            return result?.count || result || 0;
        } catch {
            return 0;
        }
    },

    // ---- POST FAVORITES ----
    addPostFavorite: async (postId: string, userId: string) => {
        return await apiCall('POST', `/posts/${postId}/favorite`, { userId });
    },

    removePostFavorite: async (postId: string, userId: string) => {
        return await apiCall('POST', `/posts/${postId}/unfavorite`, { userId });
    },

    hasUserFavorited: async (postId: string, userId: string): Promise<boolean> => {
        try {
            const result = await apiCall('GET', `/posts/${postId}/favorited/${userId}`);
            return result?.favorited || false;
        } catch {
            return false;
        }
    },

    getUserFavorites: async (userId: string) => {
        try {
            return await apiCall('GET', `/users/${userId}/favorites`) || [];
        } catch {
            return [];
        }
    },

    // ---- ATHKAR LOGS ----
    saveAthkarLog: async (userId: string, category: string, progress: { [key: string]: number }) => {
        const today = new Date().toISOString().split('T')[0];
        console.log('dbService.saveAthkarLog:', { userId, category, progress, date: today });
        return await apiCall('POST', '/athkar-logs', {
            userId,
            category,
            progress,
            date: today
        });
    },

    getAthkarLog: async (userId: string, date: string, category: string) => {
        try {
            return await apiCall('GET', `/athkar-logs/${userId}/${date}/${category}`);
        } catch {
            return null;
        }
    },

    // ==================== V2 FEATURES ====================

    // ---- SOCIAL V2 ----
    followUser: async (followerId: string, followingId: string) => {
        return await apiCall('POST', '/users/follow', { followerId, followingId });
    },

    unfollowUser: async (followerId: string, followingId: string) => {
        return await apiCall('POST', '/users/unfollow', { followerId, followingId });
    },

    getFollowers: async (userId: string) => {
        try {
            return await apiCall('GET', `/users/${userId}/followers`) || [];
        } catch { return []; }
    },

    getFollowing: async (userId: string) => {
        try {
            return await apiCall('GET', `/users/${userId}/following`) || [];
        } catch { return []; }
    },

    checkMutualFollow: async (userA: string, userB: string) => {
        try {
            const res = await apiCall('GET', `/users/check-mutual?userA=${userA}&userB=${userB}`);
            return res?.isMutual || false;
        } catch { return false; }
    },

    // ---- REMINDERS ----
    checkInactivityReminders: async (userId: string) => {
        try {
            return await apiCall('GET', `/khatma/check-reminders/${userId}`) || [];
        } catch { return []; }
    },

    markReminderSent: async (khatmaId: string) => {
        try {
            return await apiCall('POST', '/khatma/mark-reminder-sent', { khatmaId });
        } catch { return null; }
    },

    // ---- CHALLENGES ----
    getChallengeQuestions: async (count: number = 5) => {
        try {
            return await apiCall('GET', `/challenges/questions?count=${count}`) || [];
        } catch { return []; }
    },

    getQuestions: async (count: number = 5, category: string = 'all') => {
        try {
            return await apiCall('GET', `/challenges/questions?count=${count}&category=${category}`) || [];
        } catch { return []; }
    },

    getQuestionsByIds: async (ids: string[]) => {
        try {
            return await apiCall('POST', '/challenges/questions/by-ids', { ids }) || [];
        } catch { return []; }
    },

    createChallenge: async (challenge: any) => {
        try {
            return await apiCall('POST', '/challenges/create', challenge);
        } catch { return null; }
    },

    getChallenge: async (challengeId: string) => {
        try {
            return await apiCall('GET', `/challenges/${challengeId}`);
        } catch { return null; }
    },

    submitChallengeScore: async (challengeId: string, userId: string, score: number) => {
        try {
            return await apiCall('POST', '/challenges/submit', { challengeId, userId, score });
        } catch { return null; }
    },

    getInboundChallenges: async (userId: string) => {
        try {
            return await apiCall('GET', `/challenges/inbound/${userId}`) || [];
        } catch { return []; }
    },

    getChallengeLeaderboard: async () => {
        try {
            return await apiCall('GET', '/challenges/leaderboard') || [];
        } catch { return []; }
    },

    getChallengeHistory: async (userId: string) => {
        try {
            return await apiCall('GET', `/challenges/history/${userId}`) || [];
        } catch { return []; }
    },

    searchUsers: async (query: string) => {
        try {
            console.log('🔍 dbService.searchUsers:', query);
            const url = `/users/search?q=${encodeURIComponent(query)}`; console.log('📡 API URL:', url);
            const result = await apiCall('GET', url);
            console.log('📦 API Response:', result);
            return result || [];
        } catch (error) {
            console.error('❌ searchUsers error:', error);
            return [];
        }
    },

    getBlockedUsers: async (userId: string) => {
        try {
            const result = await apiCall('GET', `/users/${userId}/blocked`);
            return result || [];
        } catch (error) {
            console.error('❌ getBlockedUsers error:', error);
            return [];
        }
    },

    searchFollowing: async (userId: string, query: string) => {
        try {
            const following = await apiCall('GET', `/users/${userId}/following`) || [];
            const filtered = following.filter((u: any) =>
                u.name.toLowerCase().includes(query.toLowerCase()) ||
                u.phone.includes(query) ||
                u.id.includes(query)
            );
            return filtered;
        } catch { return []; }
    },

    searchFollowers: async (userId: string, query: string) => {
        try {
            const followers = await apiCall('GET', `/users/${userId}/followers`) || [];
            const filtered = followers.filter((u: any) =>
                u.name.toLowerCase().includes(query.toLowerCase()) ||
                u.phone.includes(query) ||
                u.id.includes(query)
            );
            return filtered;
        } catch { return []; }
    },

    searchNearbyUsers: async (location: any, query: string) => {
        try {
            const allUsers = await apiCall('GET', '/users') || [];
            const filtered = allUsers.filter((u: any) => {
                const match = u.name.toLowerCase().includes(query.toLowerCase()) ||
                    u.phone.includes(query) ||
                    u.id.includes(query);
                return match;
            });
            return filtered;
        } catch { return []; }
    },

    searchUsersByRole: async (query: string, role: string) => {
        try {
            const allUsers = await apiCall('GET', '/users') || [];
            const filtered = allUsers.filter((u: any) =>
                u.role === role && (
                    u.name.toLowerCase().includes(query.toLowerCase()) ||
                    u.phone.includes(query) ||
                    u.id.includes(query)
                )
            );
            return filtered;
        } catch { return []; }
    },

    // ---- KHATMA V2 ----
    createUserKhatma: async (khatma: any) => {
        return await apiCall('POST', '/khatma/user', khatma);
    },

    getUserKhatmas: async (userId: string) => {
        try {
            return await apiCall('GET', `/khatma/user/${userId}`) || [];
        } catch { return []; }
    },

    updateKhatmaProgress: async (khatmaId: string, userId: string, progress: any) => {
        return await apiCall('POST', `/khatma/${khatmaId}/progress`, { userId, progress });
    },

    completeUserKhatma: async (khatmaId: string, userId: string, durationDays: number) => {
        return await apiCall('POST', `/khatma/${khatmaId}/complete`, { userId, durationDays });
    },

    getKhatmaHistory: async (userId: string) => {
        try {
            return await apiCall('GET', `/khatma/history/${userId}`) || [];
        } catch { return []; }
    },

    // ---- TASBIH V2 ----
    getTasbihGoals: async (userId: string) => {
        return await apiCall('GET', `/tasbih/goals/${userId}`);
    },

    setTasbihGoal: async (userId: string, goal: number) => {
        return await apiCall('POST', '/tasbih/goals', { userId, goal });
    },

    updateTasbihStats: async (userId: string, count: number) => {
        return await apiCall('POST', '/tasbih/stats', { userId, count });
    },

    // ---- MISSING FUNCTIONS ----
    blockUser: async (userId: string, targetId: string) => {
        try {
            return await apiCall('POST', `/users/${userId}/block`, { targetId });
        } catch { return false; }
    },

    unblockUser: async (userId: string, targetId: string) => {
        try {
            return await apiCall('POST', `/users/${userId}/unblock`, { targetId });
        } catch { return false; }
    },

    sendNotification: async (userId: string, notification: any) => {
        try {
            return await apiCall('POST', `/users/${userId}/notifications`, notification);
        } catch { return false; }
    },

    getUserStats: async (userId: string) => {
        try {
            const [user, followers, following] = await Promise.all([
                apiCall('GET', `/users/${userId}`),
                apiCall('GET', `/users/${userId}/followers`),
                apiCall('GET', `/users/${userId}/following`)
            ]);
            return {
                ...user,
                followersCount: followers?.length || 0,
                followingCount: following?.length || 0,
                postsCount: 0,
                lessonsCount: 0
            };
        } catch {
            return {
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                lessonsCount: 0
            };
        }
    },

    getFollowerCount: async (userId: string) => {
        try {
            const followers = await apiCall('GET', `/users/${userId}/followers`) || [];
            return followers.length;
        } catch { return 0; }
    },

    getFollowingCount: async (userId: string) => {
        try {
            const following = await apiCall('GET', `/users/${userId}/following`) || [];
            return following.length;
        } catch { return 0; }
    }
};
