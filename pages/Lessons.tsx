import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookOpen, Lock, CheckCircle2, Clock, BookMarked, Scroll, Trophy, TrendingUp } from 'lucide-react';
import APIService from '../services/apiService';
import CertificateModal from '../components/CertificateModal';
import sampleLessonsData from '../server/data/sample_lessons.json';

interface Lesson {
    id: string;
    title: string;
    description: string;
    category: 'hadith' | 'quran';
    order_index: number;
    duration_minutes: number;
    progress?: {
        status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
        quiz_score?: number;
        quiz_total?: number;
        quiz_attempts?: number;
    };
}

export const Lessons = () => {
    const { currentUser } = useApp();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<'hadith' | 'quran'>('hadith');
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    // Certificate State
    const [isCategoryCompleted, setIsCategoryCompleted] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [completionDate, setCompletionDate] = useState<string>(new Date().toISOString());

    useEffect(() => {
        if (currentUser) {
            fetchLessons();
            checkCompletion();
        }
    }, [currentUser, activeCategory]); // Re-check when category changes

    const getProgressFromStorage = (lessonId: string) => {
        if (!currentUser) return null;
        const key = `lesson_progress_${currentUser.id}_${lessonId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    };

    const checkCompletion = () => {
        if (!currentUser) return;
        
        const categoryLessons = sampleLessonsData.filter(l => l.category === activeCategory);
        const completedLessons = categoryLessons.filter(lesson => {
            const progress = getProgressFromStorage(lesson.id);
            return progress?.status === 'completed';
        });

        const isCompleted = completedLessons.length === categoryLessons.length && categoryLessons.length > 0;
        setIsCategoryCompleted(isCompleted);
        
        if (isCompleted) {
            setCompletionDate(new Date().toISOString());
        }
    };

    const fetchLessons = () => {
        try {
            // Load lessons from sample_lessons.json and add progress information
            const lessonsWithProgress = sampleLessonsData.map((lesson, index) => {
                // Get stored progress or initialize
                const storedProgress = getProgressFromStorage(lesson.id);
                
                // If no stored progress, determine initial status
                let initialStatus: 'locked' | 'unlocked' | 'in_progress' | 'completed' = 'locked';
                
                if (index === 0) {
                    // First lesson is always unlocked
                    initialStatus = 'unlocked';
                } else if (storedProgress) {
                    // Use stored status if available
                    initialStatus = storedProgress.status;
                } else {
                    // Check if previous lesson is completed
                    const prevLesson = sampleLessonsData[index - 1];
                    const prevProgress = getProgressFromStorage(prevLesson.id);
                    if (prevProgress?.status === 'completed') {
                        initialStatus = 'unlocked';
                    }
                }

                return {
                    ...lesson,
                    progress: storedProgress || {
                        status: initialStatus,
                        quiz_score: undefined,
                        quiz_total: undefined,
                        quiz_attempts: 0
                    }
                };
            });

            setLessons(lessonsWithProgress);
        } catch (error) {
            console.error('Error loading lessons:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... (existing filters and helpers)
    const filteredLessons = lessons.filter(l => l.category === activeCategory);
    const completedCount = filteredLessons.filter(l => l.progress?.status === 'completed').length;
    const progressPercentage = filteredLessons.length > 0 ? (completedCount / filteredLessons.length) * 100 : 0;

    const getStatusIcon = (status?: string) => {
        // ... existing
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="text-emerald-500" size={24} fill="currentColor" />;
            case 'in_progress':
                return <Clock className="text-amber-500" size={24} />;
            case 'unlocked':
                return <BookOpen className="text-blue-500" size={24} />;
            default:
                return <Lock className="text-stone-400" size={24} />;
        }
    };

    const getStatusText = (status?: string) => {
        // ... existing
        switch (status) {
            case 'completed':
                return 'مكتمل';
            case 'in_progress':
                return 'قيد التقدم';
            case 'unlocked':
                return 'متاح';
            default:
                return 'مقفل';
        }
    };

    const handleLessonClick = (lesson: Lesson) => {
        if (lesson.progress?.status === 'locked') {
            return; // Do nothing if locked
        }
        navigate(`/lessons/${lesson.id}`);
    };

    if (loading) {
        // ... existing loading
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <BookMarked size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">الدروس التعليمية</h1>
                                <p className="text-emerald-100 text-sm">تعلّم دينك خطوة بخطوة</p>
                            </div>
                        </div>

                        {/* Certificate Button */}
                        {isCategoryCompleted && (
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="bg-yellow-400 hover:bg-yellow-300 text-emerald-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all animate-bounce"
                            >
                                <Trophy size={20} />
                                <span>استلام الشهادة</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">تقدمك في {activeCategory === 'hadith' ? 'الأحاديث' : 'القرآن'}</span>
                            <span className="text-sm font-bold">{completedCount} / {filteredLessons.length}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-stone-100 flex gap-2">
                <button
                    onClick={() => setActiveCategory('hadith')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeCategory === 'hadith'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                        : 'text-stone-600 hover:bg-stone-50'
                        }`}
                >
                    <Scroll size={18} />
                    الأحاديث النبوية
                </button>
                <button
                    onClick={() => setActiveCategory('quran')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeCategory === 'quran'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                        : 'text-stone-600 hover:bg-stone-50'
                        }`}
                >
                    <BookOpen size={18} />
                    القرآن الكريم
                </button>
            </div>

            {/* Lessons Grid */}
            <div className="grid gap-4">
                {filteredLessons.map((lesson, index) => (
                    <div
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className={`bg-white rounded-2xl p-5 border-2 transition-all ${lesson.progress?.status === 'locked'
                            ? 'border-stone-200 opacity-60 cursor-not-allowed'
                            : 'border-stone-100 hover:border-emerald-300 hover:shadow-lg cursor-pointer'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Order Number */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${lesson.progress?.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : lesson.progress?.status === 'locked'
                                    ? 'bg-stone-100 text-stone-400'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                {index + 1}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="font-bold text-stone-800 text-lg leading-tight">{lesson.title}</h3>
                                    {getStatusIcon(lesson.progress?.status)}
                                </div>

                                <p className="text-stone-600 text-sm mb-3 line-clamp-2">{lesson.description}</p>

                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5 text-stone-500">
                                        <Clock size={14} />
                                        <span>{lesson.duration_minutes} دقيقة</span>
                                    </div>

                                    <div className={`px-3 py-1 rounded-full font-bold ${lesson.progress?.status === 'completed'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : lesson.progress?.status === 'in_progress'
                                            ? 'bg-amber-100 text-amber-700'
                                            : lesson.progress?.status === 'unlocked'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-stone-100 text-stone-500'
                                        }`}>
                                        {getStatusText(lesson.progress?.status)}
                                    </div>

                                    {lesson.progress?.quiz_attempts && lesson.progress.quiz_attempts > 0 && (
                                        <div className="text-stone-500">
                                            محاولات: {lesson.progress.quiz_attempts}
                                        </div>
                                    )}
                                </div>

                                {lesson.progress?.status === 'completed' && lesson.progress.quiz_score !== undefined && (
                                    <div className="mt-3 flex items-center gap-2 text-emerald-700 text-sm font-bold">
                                        <Trophy size={16} fill="currentColor" />
                                        <span>النتيجة: {lesson.progress.quiz_score}/{lesson.progress.quiz_total}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredLessons.length === 0 && (
                <div className="text-center py-12 text-stone-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                    <p>لا توجد دروس متاحة حالياً</p>
                </div>
            )}

            {/* Certificate Modal */}
            <CertificateModal
                isOpen={showCertificate}
                onClose={() => setShowCertificate(false)}
                userName={currentUser?.name || 'User'}
                category={activeCategory}
                date={completionDate}
            />
        </div>
    );
};
