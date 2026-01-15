import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Users, Calendar, Navigation, Trophy, ChevronLeft } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { LessonCard } from '../components/LessonCard';
import ChallengeModal from '../components/ChallengeModal';
import APIService from '../services/apiService';

export const MosqueProfile = () => {
    const { id } = useParams();
    const { mosques, posts, lessons, followMosque, currentUser } = useApp();
    const [searchParams] = useSearchParams();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(searchParams.get('challenge'));

    const mosque = mosques.find(m => m.id === id);

    useEffect(() => {
        if (id) {
            APIService.request<any[]>(`/mosques/${id}/challenges`)
                .then(data => {
                    console.log('Fetched challenges:', data);
                    setChallenges(data || []);
                })
                .catch(error => {
                    console.error('Error fetching challenges:', error);
                    setChallenges([]);
                });
        }
    }, [id]);

    if (!mosque) return <Navigate to="/" />;

    const mosquePosts = posts.filter(p => p.mosqueId === id);
    const mosqueLessons = lessons.filter(l => l.mosqueId === id);
    const isFollowing = currentUser?.followingMosques.includes(mosque.id);

    return (
        <div className="space-y-6">
            {/* Cover Image & Info */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                <div className="h-48 md:h-64 relative">
                    <img src={mosque.image || '/imagemosqee.jfif'} alt={mosque.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 right-4 text-white">
                        <h1 className="text-3xl font-bold mb-1">{mosque.name}</h1>
                        <div className="flex items-center gap-2 text-stone-200">
                            <MapPin size={16} />
                            <span className="text-sm">{mosque.address}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-xl font-bold text-emerald-900">{mosque.followersCount}</p>
                            <p className="text-sm text-stone-500">متابع</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-emerald-900">{mosqueLessons.length}</p>
                            <p className="text-sm text-stone-500">دروس</p>
                        </div>
                        <div className="text-center border-r border-stone-200 pr-6 mr-2">
                            <p className="text-sm font-bold text-stone-800">الإمام</p>
                            <p className="text-stone-600">{mosque.imamName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.location.lat},${mosque.location.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
                        >
                            <Navigation size={18} />
                            اتجاهات
                        </a>
                        <button
                            onClick={() => followMosque(mosque.id)}
                            className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold transition-all ${isFollowing
                                ? 'bg-stone-100 text-stone-600 border border-stone-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                                }`}
                        >
                            {isFollowing ? 'أنت تتابع' : 'متابعة'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar info */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Calendar className="text-emerald-600" size={20} />
                            جدول الدروس
                        </h2>
                        {mosqueLessons.length > 0 ? (
                            <div className="space-y-2">
                                {mosqueLessons.map(lesson => (
                                    <LessonCard key={lesson.id} lesson={lesson} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-stone-500 text-sm text-center py-4">لا توجد دروس معلنة حالياً</p>
                        )}
                    </div>
                </div>

                {/* Posts Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Challenges Section */}
                    {challenges.length > 0 && (
                        <div>
                            <h2 className="font-bold text-lg mb-4 text-stone-800 flex items-center gap-2">
                                <Trophy className="text-amber-500" size={24} />
                                التحديات النشطة
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {challenges.map(challenge => {
                                    const startDate = new Date(challenge.start_date);
                                    const endDate = new Date(challenge.end_date);
                                    const isEndingSoon = (endDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000; // ينتهي خلال 24 ساعة

                                    return (
                                        <div key={challenge.id} className={`bg-gradient-to-br p-5 rounded-2xl border relative overflow-hidden ${isEndingSoon ? 'from-amber-50 to-orange-100 border-amber-200' : 'from-emerald-50 to-teal-100 border-emerald-100'}`}>
                                            <div className={`absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl -translate-x-10 -translate-y-10 ${isEndingSoon ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}></div>

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-emerald-900 text-lg">{challenge.title}</h3>
                                                    {isEndingSoon && (
                                                        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                            ينتهي قريباً
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-emerald-700 text-sm mb-4 line-clamp-2">{challenge.description}</p>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-2 text-xs text-stone-600">
                                                        <Calendar size={14} className="text-emerald-600" />
                                                        <span>من: {startDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        <span className="text-stone-400">|</span>
                                                        <span>إلى: {endDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-stone-600">
                                                        <Users size={14} className="text-emerald-600" />
                                                        <span className="bg-white/60 px-2 py-1 rounded-lg font-bold text-emerald-600">
                                                            {challenge.questions?.length || '?'} أسئلة
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedChallengeId(challenge.id)}
                                                    className={`w-full px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1 ${isEndingSoon ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                                                >
                                                    شارك الآن
                                                    <ChevronLeft size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="font-bold text-lg mb-4 text-stone-800">المنشورات والإعلانات</h2>
                        {mosquePosts.length > 0 ? (
                            mosquePosts.map(post => (
                                <PostCard key={post.id} post={post} mosque={mosque} />
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-2xl text-center text-stone-500">
                                لا توجد منشورات حتى الآن
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedChallengeId && currentUser && (
                <ChallengeModal
                    challengeId={selectedChallengeId}
                    userId={currentUser.id}
                    onClose={() => setSelectedChallengeId(null)}
                />
            )}
        </div>
    );
};