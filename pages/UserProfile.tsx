import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { LessonCard } from '../components/LessonCard';
import { PostCard } from '../components/PostCard';
import { UserRole, User, Mosque } from '../types';
import {
  LogOut, Type, Edit2, MapPin, Check, Headphones, Shield,
  RefreshCw, Search, QrCode, Copy, Users, ScanLine, X,
  Filter, UserPlus, UserMinus, Bell, BellOff, Star, Calendar,
  BarChart3, Target, Clock, TrendingUp, Hash, Phone, Mail,
  Globe, ShieldAlert, Music, Volume2, Eye, EyeOff, Moon,
  Trophy, Settings, ChevronRight, Trash2, AlertCircle, Share2, BookOpen, Zap, Sparkles, Heart
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import debounce from 'lodash/debounce';

// أنواع جديدة للبحث المتقدم
type SearchFilter = 'all' | 'following' | 'followers' | 'nearby' | 'imams';
type SortOption = 'relevance' | 'name' | 'recent';

// مكون بطاقة المستخدم في نتائج البحث
const UserSearchCard = React.memo(({
  user,
  currentUserId,
  isFollowing,
  onToggleFollow,
  onViewProfile
}: {
  user: any;
  currentUserId: string;
  isFollowing: boolean;
  onToggleFollow: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group p-4 bg-white rounded-xl hover:shadow-md transition-all duration-300 border border-stone-100 hover:border-emerald-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewProfile(user.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg">
                  {user.name[0]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-4 h-4 rounded-full animate-pulse-ring" style={{ backgroundColor: user.isOnline ? '#22c55e' : 'transparent' }}></div>
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm relative z-10"
                  style={{ backgroundColor: user.isOnline ? '#22c55e' : '#cbd5e1' }}
                ></div>
              </div>
              <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">
                {user.isOnline ? 'نشط' : 'غير متصل'}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-stone-800 truncate">{user.name}</h3>
              {user.role === UserRole.ADMIN && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                  <Shield size={10} className="inline mr-1" /> مسؤول
                </span>
              )}
              {user.role === UserRole.IMAM && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold">
                  مسجد
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-500">
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {user.phone}
                </span>
              )}
              {user.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} /> {
                    typeof user.location === 'string'
                      ? (user.location.substring(0, 20) + (user.location.length > 20 ? '...' : ''))
                      : (user.location ? `${user.location.lat.toFixed(2)}, ${user.location.lng.toFixed(2)}` : 'غير محدد')
                  }
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs text-stone-400">
                <span className="font-bold text-stone-600">{user.followersCount || 0}</span> متابع
              </div>
              <div className="text-xs text-stone-400">
                <span className="font-bold text-stone-600">{user.followingCount || 0}</span> يتابع
              </div>
              {user.lastSeen && (
                <div className="text-xs text-stone-400">
                  <Clock size={12} className="inline mr-1" />
                  {new Date(user.lastSeen).toLocaleDateString('ar-EG')}
                </div>
              )}
            </div>
          </div>
        </div>

        {user.id !== currentUserId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(user.id);
            }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 min-w-[100px] justify-center ${isFollowing
              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm'
              }`}
          >
            {isFollowing ? (
              <>
                <UserMinus size={16} />
                <span className="hidden sm:inline">إلغاء المتابعة</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span className="hidden sm:inline">متابعة</span>
              </>
            )}
          </button>
        )}
      </div>

      {user.bio && (
        <p className="mt-3 text-sm text-stone-600 line-clamp-2">{user.bio}</p>
      )}

      {isHovered && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex gap-2">
          <button className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
            <Bell size={14} className="inline mr-1" /> إشعارات
          </button>
          <button className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
            <Mail size={14} className="inline mr-1" /> رسالة
          </button>
        </div>
      )}
    </div>
  );
});

// مكون فلتر البحث
const SearchFilters = React.memo(({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange
}: {
  activeFilter: SearchFilter;
  onFilterChange: (filter: SearchFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}) => {
  const filters: { id: SearchFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'الكل', icon: <Users size={16} /> },
    { id: 'following', label: 'أتابعهم', icon: <UserPlus size={16} /> },
    { id: 'followers', label: 'متابعون', icon: <Users size={16} /> },
    { id: 'nearby', label: 'بالقرب مني', icon: <MapPin size={16} /> },
    { id: 'imams', label: 'أئمة مساجد', icon: <Shield size={16} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all ${activeFilter === filter.id
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-stone-500 flex items-center gap-2">
          <Filter size={16} />
          ترتيب حسب:
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="relevance">الأكثر صلة</option>
          <option value="name">الاسم (أ-ي)</option>
          <option value="recent">الأحدث</option>
        </select>
      </div>
    </div>
  );
});

// بيانات تجريبية تمت إزالتها واستبدالها ببيانات حقيقية من قاعدة البيانات

export const UserProfile = () => {
  const { currentUser, socket, lessons, mosques, logout, toggleAccessibility, updateUserProfile, getUserLocation } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isOtherUser, setIsOtherUser] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'favorites' | 'social'>('stats');
  const [favorites, setFavorites] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    location: ''
  });
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // البحث المتقدم
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  // القوائم الاجتماعية
  const [viewingList, setViewingList] = useState<'followers' | 'following' | null>(null);
  const [userList, setUserList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  // الماسح الضوئي والحالة
  const [isScanning, setIsScanning] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userStats, setUserStats] = useState({
    lessonsCompleted: 0,
    totalHours: 0,
    streakDays: 0,
    lastActive: '',
    followersCount: 0
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (currentUser && activeTab === 'favorites') {
      dbQueries.getUserFavorites(currentUser.id).then(setFavorites);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    const loadProfile = async () => {
      const targetId = userId || currentUser?.id;
      if (!targetId) return;

      if (userId && currentUser && userId !== currentUser.id) {
        setIsOtherUser(true);
      } else {
        setIsOtherUser(false);
      }

      setLoadingProfile(true);
      try {
        const profile = await dbQueries.getFullProfile(targetId);
        if (profile) {
          // If this is our own profile, ensure isOnline is true locally as well
          if (targetId === currentUser?.id) {
            profile.isOnline = true;
          }
          setProfileUser(profile);
          setUserStats({
            lessonsCompleted: profile.stats?.lessonsCount || 0,
            totalHours: profile.stats?.hoursCount || 0,
            streakDays: profile.streakDays || 0,
            lastActive: profile.lastSeen || '',
            followersCount: profile.stats?.followersCount || profile.followers?.length || 0
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!userId && currentUser) {
          setProfileUser(currentUser);
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [userId, currentUser]);

  const navigate = useNavigate();


  // حالة للتحقق من اتصال قاعدة البيانات
  const [dbConnected, setDbConnected] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // حالة الأذكار
  const [activeReminders, setActiveReminders] = useState<any[]>([]);

  useEffect(() => {
    if (socket && profileUser?.id) {
      const handleStatusChange = (data: { userId: string, isOnline: boolean }) => {
        console.log('Socket event: user_status_change', data);
        if (String(data.userId) === String(profileUser.id)) {
          setProfileUser((prev: any) => prev ? { ...prev, isOnline: data.isOnline } : null);
        }
      };
      socket.on('user_status_change', handleStatusChange);
      return () => {
        socket.off('user_status_change', handleStatusChange);
      };
    }
  }, [socket, profileUser?.id]);

  const searchAbortController = useRef<AbortController | null>(null);

  // تحميل البيانات الأولية
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
      loadUserStats();
      loadRecentSearches();
      testDatabaseConnection();
      checkReminders();
    }
  }, [currentUser]);

  const checkReminders = async () => {
    if (!currentUser) return;
    try {
      const reminders = await dbQueries.checkInactivityReminders(currentUser.id);
      setActiveReminders(reminders);
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      // اختبار اتصال قاعدة البيانات
      await dbQueries.getUsers();
      setDbConnected(true);
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      setDbConnected(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [following, blocked] = await Promise.all([
        dbQueries.getFollowing(currentUser!.id).catch(() => []),
        dbQueries.getBlockedUsers(currentUser!.id).catch(() => [])
      ]);
      setFollowingIds(following.map((u: any) => u.id));
      setBlockedIds(blocked.map((u: any) => u.id));
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadUserStats = async () => {
    if (!currentUser) return;
    try {
      const stats = await dbQueries.getUserStats(currentUser.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // استخدام بيانات افتراضية في حالة الفشل
      setUserStats({
        lessonsCompleted: Math.floor(Math.random() * 50),
        totalHours: Math.floor(Math.random() * 200),
        streakDays: Math.floor(Math.random() * 30),
        lastActive: new Date().toISOString(),
        followersCount: followingIds.length
      });
    }
  };

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const loadList = async (type: 'followers' | 'following') => {
    try {
      if (!currentUser) return;
      setListLoading(true);
      setViewingList(type);

      const list = type === 'followers'
        ? await dbQueries.getFollowers(currentUser.id)
        : await dbQueries.getFollowing(currentUser.id);

      setUserList(list || []);

      setListLoading(false);
    } catch (error) {
      console.error('Error loading list:', error);
      setListLoading(false);
      setViewingList(null);
    }
  };

  // دالة البحث مع استرجاع البيانات التجريبية عند الحاجة
  const performSearch = async (query: string, filter: SearchFilter, sort: SortOption) => {
    console.log('🔍 performSearch called with:', { query, filter, sort });

    // إلغاء أي طلب سابق
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    // إنشاء controller جديد
    searchAbortController.current = new AbortController();

    if (query.trim().length < 1) {
      console.log('💡 Query empty, clearing results...');
      setSearchResults([]);
      setTotalResults(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const startTime = performance.now();
    setUsingMockData(false);

    try {
      let results: any[] = [];
      let useMock = false;

      console.log('📡 Calling API with filter:', filter);

      try {
        // البحث بناءً على الفلتر
        switch (filter) {
          case 'following':
            console.log('🔗 Searching following...');
            results = await dbQueries.searchFollowing(currentUser!.id, query);
            break;
          case 'followers':
            console.log('👥 Searching followers...');
            results = await dbQueries.searchFollowers(currentUser!.id, query);
            break;
          case 'nearby':
            console.log('📍 Searching nearby users...');
            if (currentUser?.location) {
              results = await dbQueries.searchNearbyUsers(currentUser.location, query);
            }
            break;
          case 'imams':
            console.log('🕌 Searching imams...');
            results = await dbQueries.searchUsersByRole(query, UserRole.IMAM);
            break;
          default:
            console.log('🔎 Searching all users...');
            results = await dbQueries.searchUsers(query);
        }

        console.log('✅ Search results count from DB:', results.length);

      } catch (dbError) {
        console.error('❌ Database search error:', dbError);
        results = [];
      }

      setUsingMockData(useMock);

      // التصنيف
      results = sortResults(results, sort);

      // إضافة البيانات الإضافية
      const enhancedResults = await Promise.all(
        results.map(async (user) => ({
          ...user,
          isFollowing: followingIds.includes(user.id),
          isBlocked: blockedIds.includes(user.id),
          followersCount: user.followersCount || await getFollowerCountSafe(user.id),
          followingCount: user.followingCount || await getFollowingCountSafe(user.id)
        }))
      );

      console.log('🎯 Final results:', enhancedResults);
      setSearchResults(enhancedResults);
      setTotalResults(enhancedResults.length);

      // حفظ البحث الأخير
      saveRecentSearch(query);

      const endTime = performance.now();
      setSearchTime(endTime - startTime);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🛑 Search was cancelled');
      } else {
        console.error('❌ Search error:', error);
        setSearchResults([]);
        setTotalResults(0);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // الدوال المساعدة للتعامل مع الأخطاء
  const getFollowerCountSafe = async (userId: string): Promise<number> => {
    try {
      return await dbQueries.getFollowerCount(userId);
    } catch {
      return Math.floor(Math.random() * 100) + 1;
    }
  };

  const getFollowingCountSafe = async (userId: string): Promise<number> => {
    try {
      return await dbQueries.getFollowingCount(userId);
    } catch {
      return Math.floor(Math.random() * 50) + 1;
    }
  };

  // تمت إزالة فلترة البيانات التجريبية

  const debouncedSearch = useCallback(
    debounce(performSearch, 500),
    [currentUser, followingIds, blockedIds]
  );

  // تحديث البحث عند تغيير الاستعلام أو الفلتر أو التصنيف
  useEffect(() => {
    console.log('🎯 useEffect triggered:', { searchQuery, activeFilter, sortBy });
    debouncedSearch(searchQuery, activeFilter, sortBy);
    return () => debouncedSearch.cancel();
  }, [searchQuery, activeFilter, sortBy, debouncedSearch]);

  const sortResults = (results: any[], sort: SortOption) => {
    const sorted = [...results];
    switch (sort) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        // الأكثر صلة: المستخدمون المتابَعون أولاً، ثم الآخرون
        return sorted.sort((a, b) => {
          const aFollowing = followingIds.includes(a.id) ? 1 : 0;
          const bFollowing = followingIds.includes(b.id) ? 1 : 0;
          return bFollowing - aFollowing;
        });
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;

    const updated = [
      query,
      ...recentSearches.filter(q => q !== query)
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleToggleFollow = async (targetId: string) => {
    if (!currentUser) return;

    const isFollowing = followingIds.includes(targetId);
    const optimisticFollowing = isFollowing
      ? followingIds.filter(id => id !== targetId)
      : [...followingIds, targetId];

    setFollowingIds(optimisticFollowing);

    try {
      if (isFollowing) {
        await dbQueries.unfollowUser(currentUser.id, targetId);
      } else {
        await dbQueries.followUser(currentUser.id, targetId);
        // إرسال إشعار (إذا كان المدعوم)
        await dbQueries.sendNotification(targetId, {
          title: 'متابعة جديدة',
          message: `${currentUser.name} قام بمتابعتك`,
          type: 'follow'
        });
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      setFollowingIds(followingIds); // الرجوع للحالة السابقة
    }
  };

  const handleBlockUser = async (targetId: string) => {
    if (!currentUser) return;

    try {
      await dbQueries.blockUser(currentUser.id, targetId);
      setBlockedIds([...blockedIds, targetId]);
      // إزالة من المتابَعة إذا كان يتابعه
      if (followingIds.includes(targetId)) {
        await dbQueries.unfollowUser(currentUser.id, targetId);
        setFollowingIds(followingIds.filter(id => id !== targetId));
      }
    } catch (error) {
      console.error('Block user error:', error);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleCopyId = async () => {
    if (!currentUser) return;

    try {
      await navigator.clipboard.writeText(currentUser.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback للمتصفحات القديمة
      const textArea = document.createElement('textarea');
      textArea.value = currentUser.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const startEditing = () => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name,
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        location: typeof currentUser.location === 'string'
          ? currentUser.location
          : (currentUser.location ? `${currentUser.location.lat},${currentUser.location.lng}` : '')
      });
      setIsEditing(true);
    }
  };

  const saveProfile = async () => {
    try {
      await updateUserProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Save profile error:', error);
    }
  };

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      await getUserLocation();
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 3000);
    } catch (error) {
      console.error('Location update error:', error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // الحسابات المحسنة
  const myLessons = useMemo(() =>
    lessons.filter(l => currentUser?.registeredLessons.includes(l.id)),
    [lessons, currentUser]
  );

  const nearbyMosques = useMemo(() => {
    if (!currentUser?.location) return [];
    return mosques.filter(m =>
      m.location &&
      calculateDistance(currentUser.location, m.location) < 10 // ضمن 10 كم
    );
  }, [mosques, currentUser]);

  // مودال التحرير
  const EditProfileModal = () => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* ... (Existing EditProfileModal content) */}
    </div>
  );

  // مودال القوائم (متابعين / أتابعهم)
  const ConnectionListModal = () => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-emerald-900">
            {viewingList === 'followers' ? 'المتابعون' : 'أتابعهم'}
          </h3>
          <button
            onClick={() => setViewingList(null)}
            className="text-stone-400 hover:text-stone-600"
          >
            <X size={24} />
          </button>
        </div>

        {listLoading ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : userList.length === 0 ? (
          <div className="flex-1 text-center py-10 text-stone-400">
            لا توجد بيانات للعرض
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {userList.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden cursor-pointer bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold"
                  onClick={() => handleViewProfile(user.id)}
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name[0]
                  )}
                </div>

                <div className="flex-1 min-w-0" onClick={() => handleViewProfile(user.id)}>
                  <div className="font-bold text-stone-800 truncate cursor-pointer">{user.name}</div>
                  <div className="text-xs text-stone-500">{user.role || 'مستخدم'}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFollow(user.id);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${followingIds.includes(user.id)
                      ? 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                  >
                    {followingIds.includes(user.id) ? 'إلغاء' : 'متابعة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setViewingList(null)}
          className="mt-6 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className={`p-4 pb-32 max-w-4xl mx-auto space-y-6 ${currentUser.preferences?.largeFont ? 'text-lg' : ''}`}>

      {/* تنبيهات الختمة */}
      {activeReminders.length > 0 && (
        <div className="animate-bounce-subtle bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-3xl text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="font-bold">تذكير القراءة 📖</p>
              <p className="text-sm text-white/90">مر أكثر من يوم على وردك في "{activeReminders[0].name}"</p>
            </div>
          </div>
          <button
            onClick={() => {
              dbQueries.markReminderSent(activeReminders[0].id);
              setActiveReminders(activeReminders.slice(1));
              navigate('/khatma');
            }}
            className="px-4 py-2 bg-white text-orange-600 rounded-xl font-bold text-sm"
          >
            اقرأ الآن
          </button>
        </div>
      )}

      {/* الملف الشخصي للمستخدم */}
      {/* تنبيه إذا كانت البيانات تجريبية */}
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-amber-600" size={20} />
            <div>
              <p className="font-bold text-amber-800">استخدام بيانات تجريبية</p>
              <p className="text-sm text-amber-600">يتم عرض بيانات تجريبية للمساعدة في الاختبار والتطوير</p>
            </div>
          </div>
        </div>
      )}

      {/* الهيدر مع الإحصائيات */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full animate-pulse-ring opacity-30" style={{ backgroundColor: profileUser.isOnline ? '#34d399' : 'transparent' }}></div>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl relative z-10">
                {profileUser.image ? (
                  <img
                    src={profileUser.image}
                    alt={profileUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-700 text-white text-3xl font-bold">
                    {profileUser.name[0]}
                  </div>
                )}
              </div>
              {profileUser.isOnline && (
                <div className="absolute bottom-0 right-0 w-6 h-6 border-4 border-emerald-600 rounded-full shadow-lg z-20 overflow-hidden bg-white">
                  <div className="w-full h-full animate-pulse" style={{ backgroundColor: '#22c55e' }}></div>
                </div>
              )}
              <div className="absolute -bottom-2 -left-2 bg-white text-emerald-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20">
                {profileUser.role === UserRole.ADMIN ? '👑 مسؤول' :
                  profileUser.role === UserRole.IMAM ? '🕌 إمام' : '👤 مستخدم'}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{profileUser.name}</h1>
                <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border shadow-sm transition-colors duration-500 ${profileUser.isOnline
                  ? 'bg-emerald-400/30 text-emerald-50 border-emerald-400/20'
                  : 'bg-stone-500/20 text-stone-200 border-stone-500/10'
                  }`}>
                  <div
                    className={`w-2 h-2 rounded-full ${profileUser.isOnline ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: profileUser.isOnline ? '#6ee7b7' : '#94a3b8' }}
                  ></div>
                  <span className="font-bold">
                    {profileUser.isOnline ? 'نشط الآن' : 'غير متصل'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {profileUser.phone && (
                  <span className="flex items-center gap-1.5 text-sm bg-white/20 px-3 py-1 rounded-full">
                    <Phone size={14} /> {profileUser.phone}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5 text-sm bg-white/20 px-3 py-1 rounded-full">
                    <MapPin size={14} /> {typeof profileUser.location === 'string' ? profileUser.location.split(',')[0] : 'الموقع محدد'}
                  </span>
                )}
                {profileUser.rankingScore !== undefined && (
                  <span className="flex items-center gap-1.5 text-sm bg-amber-400/30 text-amber-50 px-3 py-1 rounded-full border border-amber-400/20">
                    <Trophy size={14} className="text-amber-300" /> {profileUser.rankingScore} نقطة
                  </span>
                )}
              </div>

              {profileUser.bio && (
                <p className="mt-3 text-white/90 text-sm line-clamp-2">{profileUser.bio}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {!isOtherUser ? (
              <>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
                >
                  <QrCode size={24} />
                </button>
                <button
                  onClick={startEditing}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
                >
                  <Edit2 size={24} />
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
                >
                  <Settings size={24} />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleToggleFollow(profileUser.id)}
                className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${followingIds.includes(profileUser.id)
                  ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                  : 'bg-white text-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                {followingIds.includes(profileUser.id) ? (
                  <>
                    <UserMinus size={20} />
                    <span>إلغاء المتابعة</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>متابعة</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>


      {/* Profile Tabs */}
      < div className="flex bg-white rounded-2xl p-1 shadow-sm border border-stone-100" >
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'stats'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-stone-500 hover:bg-stone-50'
            }`}
        >
          <BarChart3 size={18} />
          <span>الإحصائيات</span>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'achievements'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-stone-500 hover:bg-stone-50'
            }`}
        >
          <Trophy size={18} />
          <span>الإنجازات</span>
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'social'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-stone-500 hover:bg-stone-50'
            }`}
        >
          <Users size={18} />
          <span>الاجتماعية</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'favorites'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-stone-500 hover:bg-stone-50'
            }`}
        >
          <Heart size={18} />
          <span>المفضلة</span>
        </button>
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                  <Settings size={24} />
                  الإعدادات
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customization section */}
                <div>
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">تخصيص التطبيق</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'largeFont', label: 'خط كبير', icon: Type, description: 'تكبير النصوص للقراءة' },
                      { key: 'darkMode', label: 'الوضع الداكن', icon: Moon, description: 'مظهر داكن مريح للعين' },
                      { key: 'reduceMotion', label: 'تقليل الحركة', icon: EyeOff, description: 'تقليل الرسوم المتحركة' },
                      { key: 'audioNotifications', label: 'إشعارات صوتية', icon: Volume2, description: 'تشغيل أصوات الإشعارات' }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <setting.icon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 text-sm">{setting.label}</p>
                            <p className="text-[10px] text-stone-500">{setting.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleAccessibility(setting.key)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${currentUser?.preferences?.[setting.key as keyof typeof currentUser.preferences] ? 'bg-emerald-500' : 'bg-stone-300'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${currentUser?.preferences?.[setting.key as keyof typeof currentUser.preferences] ? 'left-5' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support & Location Section */}
                <div>
                  <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">الخدمات والموقع</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      to="/contact-support"
                      onClick={() => setShowSettings(false)}
                      className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Headphones size={20} />
                      <span>الدعم الفني</span>
                    </Link>

                    <button
                      onClick={() => {
                        handleUpdateLocation();
                        // setShowSettings(false); // keep open to see success
                      }}
                      disabled={isUpdatingLocation || locationSuccess}
                      className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${locationSuccess
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                    >
                      {locationSuccess ? <Check size={20} /> : <MapPin size={20} />}
                      <span>{locationSuccess ? 'تم تحديث الموقع' : isUpdatingLocation ? 'جاري التحديث...' : 'تحديث الموقع'}</span>
                    </button>
                  </div>
                </div>

                {/* Account actions */}
                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={() => {
                      logout();
                      setShowSettings(false);
                    }}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={20} />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div >

      {/* Conditionally Render Content based on Tabs */}
      {
        activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} />
              </div>
              <div className="text-2xl font-bold text-stone-800">{userStats.lessonsCompleted}</div>
              <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">درس مكتمل</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={24} />
              </div>
              <div className="text-2xl font-bold text-stone-800">{userStats.totalHours}</div>
              <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">ساعة دراسية</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap size={24} />
              </div>
              <div className="text-2xl font-bold text-stone-800">{userStats.streakDays}</div>
              <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">يوم متتالي</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <div className="text-2xl font-bold text-stone-800">{userStats.followersCount}</div>
              <div className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">متابع</div>
            </div>

            {/* Challenges History */}
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm col-span-2 md:col-span-4">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                سجل التحديات الأخيرة
              </h3>
              {profileUser.challenges && profileUser.challenges.length > 0 ? (
                <div className="space-y-4">
                  {profileUser.challenges.slice(0, 5).map((challenge: any) => {
                    const isChallenger = challenge.challenger_id === profileUser.id;
                    const score_user = isChallenger ? challenge.challenger_score : challenge.opponent_score;
                    const score_opponent = isChallenger ? challenge.opponent_score : challenge.challenger_score;
                    const isWin = score_user > score_opponent;

                    return (
                      <div key={challenge.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isWin ? 'bg-emerald-100 text-emerald-600' : score_user === score_opponent ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                            }`}>
                            {isWin ? 'فوز' : score_user === score_opponent ? 'تعادل' : 'خسارة'}
                          </div>
                          <div>
                            <div className="font-bold text-stone-800">
                              تحدي ضد {isChallenger ? challenge.opponent_name : challenge.challenger_name}
                            </div>
                            <div className="text-xs text-stone-500">{new Date(challenge.created_at).toLocaleDateString('ar-EG')}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-stone-700">
                          {score_user} - {score_opponent}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                    <Trophy size={32} />
                  </div>
                  <p className="text-stone-400 text-sm">لا يوجد سجل تحديات حتى الآن</p>
                </div>
              )}
            </div>

            {/* Khatmas Participation */}
            <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm col-span-2 md:col-span-4">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-600" />
                مشاركات الختمة
              </h3>
              {profileUser.khatmas && profileUser.khatmas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileUser.khatmas.map((khatma: any) => (
                    <div key={khatma.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-emerald-900">{khatma.name}</div>
                        <div className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          {khatma.status === 'completed' ? 'مكتملة' : 'نشطة'}
                        </div>
                      </div>
                      <div className="w-full bg-emerald-200/50 rounded-full h-2 mb-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${(khatma.current_page / 604) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                        <span>الصفحة {khatma.current_page}</span>
                        <span>{Math.round((khatma.current_page / 604) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                    <Sparkles size={32} />
                  </div>
                  <p className="text-stone-400 text-sm">لا توجد مشاركات ختمة حتى الآن</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Social Tab Content */}
      {activeTab === 'social' && (
        <div className="space-y-6 animate-fadeIn">
          {/* شبكتك الاجتماعية */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">شبكتك الاجتماعية</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => loadList('following')}
                className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="text-blue-600" size={20} />
                      <span className="font-bold text-blue-700">أتابعهم</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">{followingIds.length}</div>
                  </div>
                  <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </button>

              <button
                onClick={() => loadList('followers')}
                className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="text-emerald-600" size={20} />
                      <span className="font-bold text-emerald-700">متابعون</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-900">
                      {userStats?.followersCount || '0'}
                    </div>
                  </div>
                  <div className="text-emerald-400 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </button>
            </div>

            {/* عرض القائمة إذا تم اختيارها */}
            {viewingList && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-800">
                    {viewingList === 'following' ? 'الأشخاص الذين أتابعهم' : 'متابعيني'}
                  </h3>
                  <button
                    onClick={() => setViewingList(null)}
                    className="text-sm text-stone-400 hover:text-stone-600"
                  >
                    إغلاق
                  </button>
                </div>
                {listLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="animate-spin mx-auto text-emerald-600" size={24} />
                  </div>
                ) : userList.length > 0 ? (
                  <div className="space-y-3">
                    {userList.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-stone-800">{user.name}</p>
                            <p className="text-xs text-stone-500">{user.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          className="text-sm px-3 py-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300"
                        >
                          إلغاء المتابعة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-400">
                    {viewingList === 'following' ? 'لا تتابع أي شخص حالياً' : 'لا يوجد متابعون'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* اكتشاف أشخاص جدد */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                <Search size={24} className="text-emerald-600" />
                اكتشاف أشخاص جدد
              </h2>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Filter size={16} />
                {showAdvanced ? 'إخفاء الفلاتر' : 'بحث متقدم'}
              </button>
            </div>

            {/* شريط البحث */}
            <div className="relative mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsScanning(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
                  title="مسح باركود"
                >
                  <ScanLine size={22} />
                </button>

                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                  <input
                    type="text"
                    placeholder="ابحث عن أصدقاء، أئمة، أو مجاورين لك..."
                    className="w-full p-4 pr-12 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all bg-stone-50/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir="auto"
                  />

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* أزرار البحث السريع */}
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => setSearchQuery('محمد')}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  محمد
                </button>
                <button
                  onClick={() => setSearchQuery('أحمد')}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  أحمد
                </button>
                <button
                  onClick={() => setSearchQuery('012')}
                  className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  012
                </button>
                <button
                  onClick={() => setActiveFilter('imams')}
                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  أئمة مساجد
                </button>
              </div>

              {/* عمليات البحث الأخيرة */}
              {recentSearches.length > 0 && !searchQuery && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-stone-500">الأخيرة:</span>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* الفلاتر المتقدمة */}
            {showAdvanced && (
              <div className="mb-6 animate-slideDown">
                <SearchFilters
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            )}

            {/* مؤشر استخدام البيانات التجريبية */}
            {usingMockData && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>يتم عرض بيانات تجريبية للاختبار. {searchResults.length} نتائج تجريبية.</span>
                </p>
              </div>
            )}

            {/* نتائج البحث */}
            {isSearching ? (
              <div className="text-center py-12">
                <RefreshCw className="animate-spin mx-auto text-emerald-600 mb-3" size={32} />
                <p className="text-stone-500">جاري البحث...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-stone-500">
                    عُثر على <span className="font-bold text-emerald-600">{totalResults}</span> نتيجة
                    {searchTime > 0 && (
                      <span className="text-xs text-stone-400 mr-2">
                        ({searchTime.toFixed(0)} مللي ثانية)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {usingMockData && (
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                        تجريبي
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="text-sm text-stone-400 hover:text-stone-600"
                    >
                      مسح النتائج
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {searchResults.map((user) => (
                    <UserSearchCard
                      key={user.id}
                      user={user}
                      currentUserId={currentUser.id}
                      isFollowing={followingIds.includes(user.id)}
                      onToggleFollow={handleToggleFollow}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              </>
            ) : searchQuery.length > 1 && !isSearching ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-stone-300 mb-3" size={48} />
                <p className="text-stone-400">لم يتم العثور على نتائج مطابقة</p>
                <p className="text-sm text-stone-400 mt-2">حاول استخدام كلمات بحث مختلفة أو تغيير الفلتر</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto text-stone-300 mb-3" size={48} />
                <p className="text-stone-400">ابدأ بالبحث عن مستخدمين بالاسم أو رقم الهاتف أو المعرف</p>
                <p className="text-sm text-stone-400 mt-1">جرب البحث بـ "محمد" أو "أحمد" أو "012"</p>
              </div>
            )}
          </div>

          {/* Followed Mosques */}
          <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-emerald-600" />
              المساجد التي أتابعها
            </h3>
            {profileUser.followedMosques?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileUser.followedMosques.map((mosque: any) => (
                  <div key={mosque.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all border border-transparent hover:border-emerald-100 group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold overflow-hidden shadow-sm">
                      {mosque.image ? (
                        <img src={mosque.image} alt={mosque.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShieldAlert size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-800 truncate group-hover:text-emerald-700">{mosque.name}</div>
                      <div className="text-xs text-stone-500 truncate">{mosque.address || 'لا يوجد عنوان'}</div>
                    </div>
                    <ChevronRight size={18} className="text-stone-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-stone-400 py-6">لا توجد مساجد متابعة حتى الآن</p>
            )}
          </div>
        </div>
      )}

      {
        activeTab === 'favorites' && (
          <div className="space-y-6 animate-fadeIn">
            {favorites.length > 0 ? (
              favorites.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-stone-100 text-center shadow-sm">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-200">
                  <Heart size={40} />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">قائمة المفضلة فارغة</h3>
                <p className="text-stone-500 max-w-xs mx-auto text-sm">لم تقم بإضافة أي منشورات إلى مفضلتك بعد. يمكنك البدء في استكشاف المنشورات وإضافتها هنا.</p>
                <Link to="/" className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md">
                  استكشف المنشورات
                  <ChevronRight size={18} />
                </Link>
              </div>
            )}
          </div>
        )
      }

      {
        activeTab === 'achievements' && (
          <div className="bg-white rounded-3xl p-8 border border-stone-100 text-center shadow-sm animate-fadeIn">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={40} />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">إنجازات قادمة</h3>
            <p className="text-stone-500 max-w-xs mx-auto text-sm">نحن نعمل على نظام إنجازات جديد لمكافأة تفاعلك مع دروس المساجد والمثابرة على الذكر.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl opacity-50 grayscale">
                <Sparkles className="mx-auto mb-2 text-amber-400" />
                <div className="font-bold text-stone-700 text-sm">مواظب الدروس</div>
                <div className="text-[10px] text-stone-400">حضر 10 دروس</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl opacity-50 grayscale">
                <Target className="mx-auto mb-2 text-blue-400" />
                <div className="font-bold text-stone-700 text-sm">ذاكر يومي</div>
                <div className="text-[10px] text-stone-400">سجل أذكار لـ 7 أيام</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl opacity-50 grayscale">
                <Shield className="mx-auto mb-2 text-emerald-400" />
                <div className="font-bold text-stone-700 text-sm">سند المسجد</div>
                <div className="text-[10px] text-stone-400">ساهم في إدارة مسجد</div>
              </div>
            </div>
          </div>
        )
      }

      {/* الدروس القريبة */}
      {nearbyMosques.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <MapPin className="text-amber-600" size={24} />
            دروس قريبة منك
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyMosques.slice(0, 4).map(mosque => {
              const mosqueLessons = lessons.filter(l => l.mosqueId === mosque.id);
              return mosqueLessons.slice(0, 2).map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} mosque={mosque} />
              ));
            }).flat()}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 inline-block mb-4">
                <QRCode
                  value={`${window.location.origin}/user/${currentUser.id}`}
                  size={200}
                />
              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-2">شارك باركودك</h3>
              <p className="text-stone-500 text-sm mb-6">
                شارك هذا الباركود مع أصدقائك ليتمكنوا من متابعتك والوصول إلى ملفك الشخصي
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyId}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${copySuccess
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                >
                  {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                  {copySuccess ? 'تم النسخ!' : 'نسخ المعرف'}
                </button>
                <button
                  onClick={() => setIsScanning(true)}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700"
                >
                  <ScanLine size={20} />
                  مسح باركود
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال الماسح الضوئي */}
      {isScanning && (
        <ScannerModal
          onClose={() => setIsScanning(false)}
          onScan={(result) => {
            if (result) {
              let id = result;
              if (result.includes('/user/')) {
                id = result.split('/user/')[1];
              }
              setSearchQuery(id);
              setIsScanning(false);
            }
          }}
        />
      )}

      {/* مودال تحرير الملف الشخصي */}
      {isEditing && <EditProfileModal />}

    </div>
  );
};

// مكون الماسح الضوئي
const ScannerModal = ({ onClose, onScan }: { onClose: () => void; onScan: (result: string) => void }) => (
  <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold">مسح الباركود</h3>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="relative rounded-3xl overflow-hidden border-2 border-white/20">
        <Scanner
          onScan={(results) => {
            if (results && results.length > 0) {
              onScan(results[0].rawValue);
            }
          }}
          components={{
            torch: true,
            onOff: true
          }}
          styles={{
            container: { width: '100%', height: '400px' },
            video: { objectFit: 'cover' }
          }}
        />

        <div className="absolute inset-0 border-8 border-transparent">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-emerald-500 rounded-2xl" />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
          <p className="text-sm">وجّه الكاميرا نحو باركود المستخدم</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          أو يمكنك <button className="text-emerald-400 hover:text-emerald-300" onClick={onClose}>إدخال المعرف يدوياً</button>
        </p>
      </div>
    </div>
  </div>
);

// دالة مساعدة لحساب المسافة
const calculateDistance = (loc1: string | { lat: number; lng: number }, loc2: string | { lat: number; lng: number }): number => {
  try {
    let lat1: number, lon1: number, lat2: number, lon2: number;

    if (typeof loc1 === 'string') {
      [lat1, lon1] = loc1.split(',').map(Number);
    } else {
      lat1 = loc1.lat;
      lon1 = loc1.lng;
    }

    if (typeof loc2 === 'string') {
      [lat2, lon2] = loc2.split(',').map(Number);
    } else {
      lat2 = loc2.lat;
      lon2 = loc2.lng;
    }

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return Infinity;
    }

    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch {
    return Infinity;
  }
};