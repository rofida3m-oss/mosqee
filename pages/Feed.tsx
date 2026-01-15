import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { LessonCard } from '../components/LessonCard';
import { PrayerTracker } from '../components/PrayerTracker';
import { Search, MapPin, SlidersHorizontal, PlusCircle, Building2, Quote, BookOpen, Trophy, ChevronLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateDistance } from '../utils/location';
import { Post, Mosque, UserRole } from '../types';
import { getHijriDate } from '../utils/dateUtils';
import APIService from '../services/apiService';


export const Feed = () => {
    const { posts, mosques, lessons, currentUser, getUserLocation } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMosque, setSelectedMosque] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loadingChallenges, setLoadingChallenges] = useState(true);

    useEffect(() => {
        if (!currentUser?.location) {
            getUserLocation();
        }
    }, [currentUser, getUserLocation]);

    // Fetch challenges from all mosques
    useEffect(() => {
        const fetchAllChallenges = async () => {
            if (!mosques || mosques.length === 0) return;

            setLoadingChallenges(true);
            try {
                const allChallenges: any[] = [];

                // Fetch challenges from each mosque
                const promises = mosques.map(mosque =>
                    APIService.request<any[]>(`/mosques/${mosque.id}/challenges`)
                        .catch(() => [])
                );

                const results = await Promise.all(promises);
                results.forEach(challengeList => {
                    if (challengeList && challengeList.length > 0) {
                        allChallenges.push(...challengeList);
                    }
                });

                // Backend already filters by is_active=1 and dates, so we can use results directly
                setChallenges(allChallenges);
            } catch (error) {
                console.error('Error fetching challenges:', error);
            } finally {
                setLoadingChallenges(false);
            }
        };

        fetchAllChallenges();
    }, [mosques]);

    // SMART FEED ALGORITHM WITH SEARCH & FILTER
    const smartPosts = useMemo(() => {
        if (!posts || !mosques || posts.length === 0) return [];

        let filtered = [...posts];

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => {
                const mosque = mosques.find(m => m.id === p.mosqueId);
                return p.content.toLowerCase().includes(q) ||
                    (mosque && mosque.name.toLowerCase().includes(q));
            });
        }

        // Mosque Filter
        if (selectedMosque !== 'all') {
            filtered = filtered.filter(p => p.mosqueId === selectedMosque);
        }

        // Type Filter
        if (selectedType !== 'all') {
            filtered = filtered.filter(p => p.type === selectedType);
        }

        return filtered.map(post => {
            let score = 0;
            const mosque = mosques.find(m => m.id === post.mosqueId);
            if (!mosque) return null;

            const isFollowing = currentUser?.followingMosques.includes(mosque.id);
            const distance = currentUser?.location ? calculateDistance(
                currentUser.location.lat, currentUser.location.lng,
                mosque.location.lat, mosque.location.lng
            ) : 999;

            if (post.type === 'lesson_alert' || post.type === 'announcement') {
                if (distance < 5) score += 50;
                else score += 20;
            }

            if (isFollowing) score += 30;

            if (distance < 2) score += 15;
            else if (distance < 10) score += 5;

            const hoursOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
            score -= hoursOld * 0.5;

            score += (post.likes * 0.2);

            return { post, score, mosque };
        })
            .filter((p): p is { post: Post, score: number, mosque: Mosque } => p !== null)
            .sort((a, b) => b.score - a.score);

    }, [posts, mosques, currentUser, searchQuery, selectedMosque, selectedType]);

    const upcomingLessons = lessons
        .filter(l => new Date(l.date) > new Date())
        .slice(0, 3);

    const hijriDate = getHijriDate(new Date());

    return (
        <div className="space-y-6">
            {/* Header Mobile */}
            <div className="md:hidden flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-900">الرئيسية</h1>
                    <p className="text-xs text-emerald-600 font-medium">{hijriDate}</p>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={currentUser?.image || '/user.png'} alt={currentUser?.name} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Location Banner */}
            <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <MapPin className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-100">موقعك الحالي</p>
                        <p className="font-bold text-sm" dir="ltr">
                            {currentUser?.location
                                ? `${currentUser.location.lat.toFixed(4)}, ${currentUser.location.lng.toFixed(4)}`
                                : 'جاري تحديد الموقع...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => getUserLocation()}
                    className="bg-white text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors"
                >
                    تحديث
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Feed Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Search and Filters */}
                    <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-stone-100 space-y-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث في المنشورات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-100 rounded-xl py-2.5 md:py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={selectedMosque}
                                onChange={(e) => setSelectedMosque(e.target.value)}
                                className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">جميع المساجد</option>
                                {mosques.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
                            >
                                <option value="all">جميع المنشورات</option>
                                <option value="announcement">إعلانات</option>
                                <option value="lesson_alert">دروس</option>
                                <option value="news">أخبار</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW: Prayer Tracker Widget */}
                    <PrayerTracker />

                    {/* Active Challenges Section */}
                    {!loadingChallenges && challenges.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                                    <Trophy size={18} className="text-amber-500" />
                                    التحديات النشطة
                                </h2>
                                <Link to="/challenges" className="text-xs text-emerald-600 font-medium">عرض الكل</Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {challenges.slice(0, 4).map(challenge => {
                                    const startDate = new Date(challenge.start_date);
                                    const endDate = new Date(challenge.end_date);
                                    const isEndingSoon = (endDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000;
                                    const mosque = mosques.find(m => m.id === challenge.mosque_id);

                                    return (
                                        <div key={challenge.id} className={`bg-gradient-to-br p-4 rounded-xl border relative overflow-hidden ${isEndingSoon ? 'from-amber-50 to-orange-100 border-amber-200' : 'from-emerald-50 to-teal-100 border-emerald-100'}`}>
                                            <div className={`absolute top-0 left-0 w-20 h-20 rounded-full blur-2xl -translate-x-8 -translate-y-8 ${isEndingSoon ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}></div>

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-emerald-900 text-sm">{challenge.title}</h3>
                                                    {isEndingSoon && (
                                                        <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                            ينتهي قريباً
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 mb-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
                                                        <Calendar size={12} className="text-emerald-600" />
                                                        <span>ينتهي: {endDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                                    </div>

                                                    {mosque && (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
                                                            <Building2 size={12} className="text-emerald-600" />
                                                            <span className="truncate">{mosque.name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Link
                                                    to={`/mosque/${challenge.mosque_id}?challenge=${challenge.id}`}
                                                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1 ${isEndingSoon ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                                                >
                                                    شارك الآن
                                                    <ChevronLeft size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <SlidersHorizontal size={18} className="text-emerald-600" />
                            {searchQuery || selectedMosque !== 'all' || selectedType !== 'all' ? 'نتائج البحث' : 'منشورات تهمك'}
                        </h2>
                        {(searchQuery || selectedMosque !== 'all' || selectedType !== 'all') && (
                            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full">{smartPosts.length} منشور</span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {smartPosts.length > 0 ? (
                            smartPosts.map(({ post, mosque }) => (
                                <PostCard key={post.id} post={post} mosque={mosque as any} />
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl p-12 border border-stone-100 shadow-sm text-center">
                                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-4">
                                    <Search size={32} />
                                </div>
                                <h3 className="font-bold text-stone-800 mb-1">لا توجد نتائج</h3>
                                <p className="text-xs text-stone-400 max-w-[200px] mx-auto">حاول البحث بكلمات أخرى أو تغيير الفلاتر</p>
                                {(searchQuery || selectedMosque !== 'all' || selectedType !== 'all') && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedMosque('all'); setSelectedType('all'); }}
                                        className="mt-4 text-emerald-600 text-xs font-bold hover:underline"
                                    >
                                        إعادة ضبط الفلاتر
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Daily Inspiration */}
                    <DailyInspiration />

                    {/* Upcoming Lessons */}
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 sticky top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-stone-800">دروس قادمة</h2>
                            <Link to="/explore" className="text-xs text-emerald-600 font-medium">عرض الكل</Link>
                        </div>

                        {upcomingLessons.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingLessons.map(lesson => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        mosque={mosques.find(m => m.id === lesson.mosqueId)}
                                        showMosqueName
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-stone-500 text-sm text-center py-4">لا توجد دروس قادمة حالياً</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyInspiration = () => {
    // Ideally this comes from a database or API, hardcoded for demo
    const data = [
        { type: 'ayah', text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", source: "سورة البقرة: 152" },
        { type: 'hadith', text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "رواه البخاري" },
        { type: 'ayah', text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح: 6" },
    ];

    // Pick based on day of month to be consistent for the day
    const index = new Date().getDate() % data.length;
    const item = data[index];

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
            <Quote className="absolute top-4 right-4 text-amber-200 w-12 h-12 rotate-180" />
            <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-3 font-bold text-sm">
                    <BookOpen size={16} />
                    <span>{item.type === 'ayah' ? 'آية اليوم' : 'حديث اليوم'}</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-stone-800 font-cairo leading-relaxed mb-3">
                    {item.text}
                </p>
                <p className="text-amber-700 text-sm font-medium">{item.source}</p>
            </div>
        </div>
    );
};