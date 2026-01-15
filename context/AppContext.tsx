import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, Mosque, Lesson, Post, UserRole, SupportTicket, PrayerLog, Khatma, Comment } from '../types';
import { calculateDistance } from '../utils/location';
import { getPrayerTimes, getNextPrayer, PrayerTimes } from '../utils/prayerTimes';
import { getDayStatus } from '../utils/dateUtils';
import { initDB, dbQueries } from '../services/dbService';
import APIService from '../services/apiService';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  // Use VITE_SOCKET_URL if set, otherwise derive from VITE_API_URL
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // If API URL is set, derive socket URL from it (remove /api suffix if present)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }

  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const isLocalIP = /^192\.168\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host);

  if (isLocalhost || isLocalIP) {
    return `http://${host}:5000`;
  } else {
    // Production fallback: use same protocol and host
    console.warn('⚠️ VITE_API_URL or VITE_SOCKET_URL not set! Using same domain fallback.');
    return `${protocol}//${host}`;
  }
};

const SOCKET_URL = getSocketUrl();

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'error';
  read: boolean;
}

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  mosques: Mosque[];
  lessons: Lesson[];
  posts: Post[];
  notifications: Notification[];
  prayerTimes: PrayerTimes | null;
  nextPrayer: { name: string; time: string; remainingMinutes: number } | null;
  socket: Socket | null;
  authChecked: boolean;

  // Admin Data
  allUsers: User[];
  supportTickets: SupportTicket[];

  // Auth Methods
  login: (name: string, phone: string, isAdmin?: boolean) => Promise<void>;
  registerUser: (name: string, phone: string) => Promise<void>;
  registerMosque: (data: { name: string; imamName: string; address: string; phone: string }) => Promise<void>;
  logout: () => void;

  // Features
  registerForLesson: (lessonId: string) => void;
  followMosque: (mosqueId: string) => void;
  getUserLocation: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  syncUser: () => Promise<void>;
  searchMosques: (query: string) => Mosque[];
  addLesson: (lessonData: Omit<Lesson, 'id' | 'mosqueId'>) => Promise<void>;
  addPost: (postData: Omit<Post, 'id' | 'mosqueId' | 'likes' | 'createdAt'>) => Promise<void>;
  updateMosque: (mosqueId: string, data: Partial<Mosque>) => Promise<void>;
  dismissNotification: (id: string) => void;
  toggleAccessibility: (type: 'largeFont' | 'highContrast') => void;
  markNotificationsAsRead: () => void;

  // Admin Methods
  toggleUserStatus: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createSupportTicket: (subject: string, message: string) => Promise<void>;
  replyToTicket: (ticketId: string, reply: string) => Promise<void>;

  // Prayer & Tasbih Methods
  savePrayerLog: (log: PrayerLog) => Promise<void>;
  getPrayerLog: (date: string) => Promise<PrayerLog | null>;
  saveKhatma: (khatma: Khatma) => Promise<void>;
  getKhatma: () => Promise<Khatma | null>;
  addCommentToPost: (postId: string, comment: Comment) => Promise<void>;

  // Post Interactions
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  deletePostComment: (postId: string, commentId: string) => Promise<void>;
  editPostComment: (postId: string, commentId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, content: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Admin State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Prayer Times State
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingMinutes: number } | null>(null);

  // Initialize DB and Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        await refreshData();
        setDbLoaded(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    loadData();
  }, []);

  // Initialize Socket
  useEffect(() => {
    if (!currentUser) return;

    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      console.log('✅ Socket connected:', s.id);
      s.emit('register_user', currentUser.id);
    });

    s.on('notification_received', (data) => {
      console.log('🔔 Notification received:', data);
      addNotification({
        id: data.id || Date.now().toString(),
        title: data.type === 'follow' ? 'متابعة جديدة' : 'تنبيه',
        message: data.content,
        type: 'info',
        read: false
      });
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.preferences) {
      const prefs = currentUser.preferences;
      document.documentElement.classList.toggle('dark-mode', !!prefs.darkMode);
      document.documentElement.classList.toggle('reduce-motion', !!prefs.reduceMotion);
      document.documentElement.style.fontSize = prefs.largeFont ? '18px' : '16px';
    }
  }, [currentUser?.preferences]);

  const syncUser = useCallback(async () => {
    if (dbLoaded) {
      const storedUserId = localStorage.getItem('jami_user_id');
      if (storedUserId) {
        try {
          const userFromDB = await dbQueries.getUser(storedUserId);
          if (userFromDB) {
            setCurrentUser(userFromDB);
            if (userFromDB.preferences?.largeFont) {
              document.documentElement.style.fontSize = '18px';
            }
          } else {
            // Only clear if result is explicitly null (meaning search completed but user not found)
            console.warn('User session invalidated: Not found in database');
            localStorage.removeItem('jami_user_id');
            localStorage.removeItem('jami_user_phone');
            localStorage.removeItem('jami_user_name');
            setCurrentUser(null);
          }
        } catch (error: any) {
          console.error('Failed to sync user session (server error):', error);
          // DO NOT log out here. The user might still be valid, just server is busy.
        }
      }
      setAuthChecked(true);
    }
  }, [dbLoaded]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const refreshData = useCallback(async () => {
    try {
      const [mosquesList, lessonsList, usersList, ticketsList, postsList] = await Promise.all([
        dbQueries.getMosques(),
        dbQueries.getLessons(),
        dbQueries.getUsers(),
        dbQueries.getTickets(),
        dbQueries.getPosts()
      ]);

      setMosques(((mosquesList || []) as any[]).map(m => ({
        ...m,
        image: m.image && m.image.trim() !== '' ? m.image : '/imagemosqee.jfif'
      })));
      setLessons(lessonsList || []);
      setAllUsers(usersList || []);
      setSupportTickets(ticketsList || []);
      setPosts(postsList || []);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const syncInterval = setInterval(async () => {
      try {
        const [serverPosts, serverLessons, serverMosques] = await Promise.all([
          APIService.getPosts(),
          APIService.getLessons(),
          APIService.getMosques()
        ]);

        if (serverPosts && serverPosts.length > 0) setPosts(serverPosts);
        if (serverLessons && serverLessons.length > 0) setLessons(serverLessons);
        if (serverMosques && serverMosques.length > 0) {
          setMosques((serverMosques as any[]).map(m => ({
            ...m,
            image: m.image && m.image.trim() !== '' ? m.image : '/imagemosqee.jfif'
          })));
        }
      } catch (e) {
        console.debug('Sync failed, using local data');
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [currentUser]);

  useEffect(() => {
    const updatePrayerTimes = () => {
      if (!currentUser || !currentUser.location) {
        const times = getPrayerTimes(new Date(), 30.0444, 31.2357);
        setPrayerTimes(times);
        setNextPrayer(getNextPrayer(times));
      } else {
        const times = getPrayerTimes(new Date(), currentUser.location.lat, currentUser.location.lng);
        setPrayerTimes(times);
        setNextPrayer(getNextPrayer(times));
      }
    };
    updatePrayerTimes();
  }, [currentUser]);

  useEffect(() => {
    const prayerInterval = setInterval(() => {
      if (!currentUser || !currentUser.location) {
        const times = getPrayerTimes(new Date(), 30.0444, 31.2357);
        setPrayerTimes(times);
        setNextPrayer(getNextPrayer(times));
      } else {
        const times = getPrayerTimes(new Date(), currentUser.location.lat, currentUser.location.lng);
        setPrayerTimes(times);
        setNextPrayer(getNextPrayer(times));
      }
    }, 60000);
    return () => clearInterval(prayerInterval);
  }, [currentUser]);

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toDateString();

      if (currentUser && prayerTimes && nextPrayer) {
        if (nextPrayer.remainingMinutes <= 15 && nextPrayer.remainingMinutes >= 14) {
          const id = `prayer_warn_${nextPrayer.name}_${now.getDate()}`;
          if (!notifications.some(n => n.id === id)) {
            addNotification({ id, title: 'اقتربت الصلاة', message: `متبقي حوالي 15 دقيقة على صلاة ${nextPrayer.name}`, type: 'alert', read: false });
          }
        }
        if (nextPrayer.remainingMinutes <= 1 && nextPrayer.remainingMinutes >= 0) {
          const id = `prayer_now_${nextPrayer.name}_${now.getDate()}`;
          if (!notifications.some(n => n.id === id)) {
            addNotification({ id, title: `حان الآن موعد صلاة ${nextPrayer.name}`, message: 'حي على الصلاة، حي على الفلاح', type: 'success', read: false });
          }
        }
      }
      const lastAthkarDate = localStorage.getItem('last_athkar_date');
      if (currentHour >= 5 && currentHour < 11 && lastAthkarDate !== todayStr) {
        addNotification({ id: `athkar_m_${Date.now()}`, title: 'أذكار الصباح', message: 'ابدأ يومك بذكر الله.', type: 'info', read: false });
        localStorage.setItem('last_athkar_date', todayStr);
      } else if (currentHour >= 15 && currentHour < 21 && lastAthkarDate !== todayStr) {
        addNotification({ id: `athkar_e_${Date.now()}`, title: 'أذكار المساء', message: 'حافظ على أذكارك.', type: 'info', read: false });
        localStorage.setItem('last_athkar_date', todayStr);
      }
    };
    const interval = setInterval(checkAlerts, 60000);
    checkAlerts();
    return () => clearInterval(interval);
  }, [currentUser, prayerTimes, nextPrayer, notifications]);

  const addNotification = useCallback((note: Notification) => {
    setNotifications(prev => [note, ...prev]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const login = useCallback(async (name: string, phone: string, isAdmin: boolean = false) => {
    const user = await APIService.loginUser(name, phone, isAdmin);
    if (!user) throw new Error('Failed to login user');
    await refreshData();
    setCurrentUser(user);
    localStorage.setItem('jami_user_id', user.id);
    localStorage.setItem('jami_user_phone', user.phone);
    localStorage.setItem('jami_user_name', user.name);
  }, [refreshData]);

  const registerUser = useCallback(async (name: string, phone: string) => {
    const newUser = await APIService.registerUser(name, phone);
    await refreshData();
    setCurrentUser(newUser);
    localStorage.setItem('jami_user_id', newUser.id);
    localStorage.setItem('jami_user_phone', newUser.phone);
    localStorage.setItem('jami_user_name', newUser.name);
    return newUser;
  }, [refreshData]);

  const registerMosque = useCallback(async (data: { name: string; imamName: string; address: string; phone: string }) => {
    try {
      const newMosqueId = 'm_' + Date.now();
      const newMosque: Mosque = {
        id: newMosqueId,
        name: data.name,
        imamName: data.imamName,
        address: data.address,
        phone: data.phone,
        location: { lat: 30.0444, lng: 31.2357 },
        image: '/imagemosqee.jfif',
        followersCount: 0,
        amenities: []
      };

      // 1. Create Mosque on Server
      await APIService.createMosque({
        id: newMosqueId,
        name: data.name,
        location: data.address,
        lat: 30.0444,
        lng: 31.2357
      } as any);

      // 2. Create User on Server with Mosque Role
      const newUser = await APIService.request<User>('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.imamName,
          phone: data.phone,
          role: 'mosque',
          managedMosqueId: newMosqueId
        })
      });

      // 3. Save locally
      await dbQueries.addMosque(newMosque);
      await dbQueries.addUser(newUser);

      await refreshData();
      setCurrentUser(newUser);
      localStorage.setItem('jami_user_id', newUser.id);
      localStorage.setItem('jami_user_phone', newUser.phone);
      localStorage.setItem('jami_user_name', newUser.name);

      return newUser;
    } catch (error) {
      console.error('Failed to register mosque:', error);
      throw error;
    }
  }, [refreshData]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('jami_user_id');
    localStorage.removeItem('jami_user_phone');
    localStorage.removeItem('jami_user_name');
  }, []);

  const getUserLocation = useCallback(async (): Promise<void> => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (currentUser) {
          const updated = { ...currentUser, location: newLoc };
          await dbQueries.updateUser(updated);
          setCurrentUser(updated);
        }
      });
    }
  }, [currentUser]);

  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    await dbQueries.updateUser(updated);
    setCurrentUser(updated);
    await APIService.updateUser(updated).catch(() => { });
  }, [currentUser]);

  const followMosque = useCallback(async (mosqueId: string) => {
    if (!currentUser) return;
    const isFollowing = currentUser.followingMosques.includes(mosqueId);
    const updatedFollowing = isFollowing ? currentUser.followingMosques.filter(id => id !== mosqueId) : [...currentUser.followingMosques, mosqueId];
    const updatedUser = { ...currentUser, followingMosques: updatedFollowing };
    await dbQueries.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    await APIService.updateUser(updatedUser).catch(() => { });
  }, [currentUser]);

  const registerForLesson = useCallback(async (lessonId: string) => {
    if (!currentUser || currentUser.registeredLessons.includes(lessonId)) return;
    const updatedUser = { ...currentUser, registeredLessons: [...currentUser.registeredLessons, lessonId] };
    await dbQueries.updateUser(updatedUser);
    setCurrentUser(updatedUser);
  }, [currentUser]);

  const searchMosques = useCallback((query: string) => {
    if (!query) return mosques;
    const q = query.toLowerCase();
    return mosques.filter(m => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q));
  }, [mosques]);

  const addLesson = useCallback(async (data: any) => {
    if (!currentUser?.managedMosqueId) return;
    const newLesson = { id: 'l_' + Date.now(), mosqueId: currentUser.managedMosqueId, ...data };
    await dbQueries.addLesson(newLesson);
    await refreshData();
  }, [currentUser, refreshData]);

  const addPost = useCallback(async (data: any) => {
    if (!currentUser?.managedMosqueId) return;
    const newPost = { id: 'p_' + Date.now(), mosqueId: currentUser.managedMosqueId, userId: currentUser.id, likes: 0, createdAt: new Date().toISOString(), ...data };
    await dbQueries.addPost(newPost);
    await refreshData();
  }, [currentUser, refreshData]);

  const updateMosque = useCallback(async (mosqueId: string, data: any) => {
    const mosque = mosques.find(m => m.id === mosqueId);
    if (!mosque) return;
    const updated = { ...mosque, ...data };
    await dbQueries.updateMosque(updated);
    setMosques(prev => prev.map(m => m.id === mosqueId ? updated : m));
  }, [mosques]);

  const toggleAccessibility = useCallback((type: string) => {
    if (!currentUser) return;
    const newPrefs = { ...currentUser.preferences, [type]: !currentUser.preferences?.[type as keyof typeof currentUser.preferences] };
    const updated = { ...currentUser, preferences: newPrefs };
    dbQueries.updateUser(updated);
    setCurrentUser(updated);
  }, [currentUser]);

  const toggleUserStatus = useCallback(async (id: string) => {
    const u = allUsers.find(x => x.id === id);
    if (u) {
      const updated = { ...u, isActive: !u.isActive };
      await dbQueries.updateUser(updated);
      await refreshData();
    }
  }, [allUsers, refreshData]);

  const deleteUser = useCallback(async (id: string) => {
    await dbQueries.deleteUser(id);
    await refreshData();
  }, [refreshData]);

  const createSupportTicket = useCallback(async (subject: string, message: string) => {
    if (!currentUser) return;
    const ticket: SupportTicket = { id: 't_' + Date.now(), userId: currentUser.id, userName: currentUser.name, subject, message, status: 'open', createdAt: new Date().toISOString() };
    await dbQueries.addTicket(ticket);
    setSupportTickets(prev => [ticket, ...prev]);
  }, [currentUser]);

  const replyToTicket = useCallback(async (id: string, reply: string) => {
    const t = supportTickets.find(x => x.id === id);
    if (t) {
      const updated = { ...t, reply, status: 'closed' as const };
      await dbQueries.updateTicket(updated);
      setSupportTickets(prev => prev.map(x => x.id === id ? updated : x));
    }
  }, [supportTickets]);

  const savePrayerLog = useCallback(async (log: PrayerLog) => {
    if (!currentUser) return;
    const fullLog = { ...log, userId: currentUser.id };
    await dbQueries.updatePrayerLog(fullLog);
  }, [currentUser]);

  const getPrayerLog = useCallback(async (date: string) => currentUser ? dbQueries.getPrayerLog(currentUser.id, date) : null, [currentUser]);

  const saveKhatma = useCallback(async (k: Khatma) => { await dbQueries.updateKhatma(k); }, []);

  const getKhatma = useCallback(async () => currentUser ? dbQueries.getUserKhatmas(currentUser.id).then(ks => ks[0] || null) : null, [currentUser]);

  const addCommentToPost = useCallback(async (postId: string, comment: Comment) => { await dbQueries.addPostComment(comment); await refreshData(); }, [refreshData]);

  const likePost = useCallback(async (id: string) => { if (currentUser) { await dbQueries.addPostLike(id, currentUser.id); await refreshData(); } }, [currentUser, refreshData]);
  const unlikePost = useCallback(async (id: string) => { if (currentUser) { await dbQueries.removePostLike(id, currentUser.id); await refreshData(); } }, [currentUser, refreshData]);
  const sharePost = useCallback(async (id: string) => { if (currentUser) { await dbQueries.addPostShare(id, currentUser.id); await refreshData(); } }, [currentUser, refreshData]);
  const deletePostComment = useCallback(async (pid: string, cid: string) => { await dbQueries.deletePostComment(pid, cid); await refreshData(); }, [refreshData]);
  const editPostComment = useCallback(async (pid: string, cid: string, content: string) => {
    try {
      await APIService.editComment(cid, content);
      await refreshData();
    } catch (e) {
      console.error('Failed to edit comment:', e);
    }
  }, [refreshData]);
  const deletePost = useCallback(async (id: string) => { await dbQueries.deletePost(id); await refreshData(); }, [refreshData]);
  const editPost = useCallback(async (id: string, content: string) => { await dbQueries.updatePost({ id, content } as any); await refreshData(); }, [refreshData]);

  const value = {
    currentUser, isAuthenticated: !!currentUser, authChecked, mosques, lessons, posts, notifications, prayerTimes, nextPrayer, socket,
    allUsers, supportTickets,
    login, registerUser, registerMosque, logout,
    registerForLesson, followMosque, getUserLocation, updateUserProfile, searchMosques, addLesson, addPost, updateMosque, dismissNotification, toggleAccessibility, markNotificationsAsRead,
    toggleUserStatus, deleteUser, createSupportTicket, replyToTicket,
    savePrayerLog, getPrayerLog, saveKhatma, getKhatma, addCommentToPost,
    likePost, unlikePost, sharePost, deletePostComment, editPostComment, deletePost, editPost,
    syncUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};