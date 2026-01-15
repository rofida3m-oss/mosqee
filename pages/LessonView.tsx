import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, BookOpen, Clock, CheckCircle, Scroll, User } from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    description: string;
    category: 'hadith' | 'quran';
    duration_minutes: number;
    hadith_text?: string;
    hadith_narrator?: string;
    hadith_explanation?: string;
    hadith_lessons?: string;
    quran_verses?: string;
    quran_surah?: string;
    quran_verse_numbers?: string;
    quran_word_meanings?: string;
    quran_tafseer?: string;
    progress?: {
        status: string;
    };
}

export const LessonView = () => {
    const { lessonId } = useParams();
    const { currentUser } = useApp();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser && lessonId) {
            fetchLesson();
        }
    }, [currentUser, lessonId]);

    const fetchLesson = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/educational-lessons/${lessonId}?userId=${currentUser?.id}`);
            const data = await response.json();
            setLesson(data);
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartQuiz = async () => {
        try {
            // Mark lesson as in_progress
            await fetch(`http://localhost:5000/api/educational-lessons/${lessonId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser?.id })
            });

            // Navigate to quiz
            navigate(`/lessons/${lessonId}/quiz`);
        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="text-center py-12">
                <p className="text-stone-500">الدرس غير موجود</p>
            </div>
        );
    }

    const wordMeanings = lesson.quran_word_meanings ? JSON.parse(lesson.quran_word_meanings) : {};

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/lessons')}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-stone-100 flex items-center justify-center hover:border-emerald-300 transition-colors"
                >
                    <ArrowRight size={20} className="text-stone-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-stone-800">{lesson.title}</h1>
                    <p className="text-stone-500 text-sm">{lesson.description}</p>
                </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                {lesson.category === 'hadith' ? (
                    <div className="space-y-6">
                        {/* Hadith Text */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Scroll className="text-emerald-600" size={20} />
                                <h3 className="font-bold text-emerald-900">نص الحديث</h3>
                            </div>
                            <p className="text-stone-800 leading-loose text-lg font-arabic text-right">
                                {lesson.hadith_text}
                            </p>
                        </div>

                        {/* Narrator */}
                        {lesson.hadith_narrator && (
                            <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                                <User className="text-stone-500" size={18} />
                                <div>
                                    <p className="text-xs text-stone-500 font-bold">الراوي</p>
                                    <p className="text-stone-700 font-bold">{lesson.hadith_narrator}</p>
                                </div>
                            </div>
                        )}

                        {/* Explanation */}
                        {lesson.hadith_explanation && (
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                                    <BookOpen size={18} className="text-blue-600" />
                                    شرح الحديث
                                </h3>
                                <div className="prose prose-stone max-w-none">
                                    <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                                        {lesson.hadith_explanation}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Lessons Learned */}
                        {lesson.hadith_lessons && (
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                                    <CheckCircle className="text-emerald-600" size={18} />
                                    الدروس المستفادة
                                </h3>
                                <div className="bg-emerald-50 rounded-xl p-4">
                                    <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                                        {lesson.hadith_lessons}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Quran Verses */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="text-blue-600" size={20} />
                                    <h3 className="font-bold text-blue-900">الآيات الكريمة</h3>
                                </div>
                                <div className="text-sm text-blue-700 font-bold">
                                    {lesson.quran_surah} ({lesson.quran_verse_numbers})
                                </div>
                            </div>
                            <p className="text-stone-800 leading-loose text-xl font-arabic text-center">
                                {lesson.quran_verses}
                            </p>
                        </div>

                        {/* Word Meanings */}
                        {Object.keys(wordMeanings).length > 0 && (
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3">معاني الكلمات</h3>
                                <div className="grid gap-2">
                                    {Object.entries(wordMeanings).map(([word, meaning]) => (
                                        <div key={word} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                                            <span className="font-bold text-blue-700 min-w-[100px]">{word}</span>
                                            <span className="text-stone-600">{meaning as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tafseer */}
                        {lesson.quran_tafseer && (
                            <div>
                                <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                                    <BookOpen size={18} className="text-indigo-600" />
                                    التفسير
                                </h3>
                                <div className="prose prose-stone max-w-none">
                                    <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                                        {lesson.quran_tafseer}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Duration Info */}
            <div className="flex items-center justify-center gap-2 text-stone-500 text-sm">
                <Clock size={16} />
                <span>المدة المتوقعة: {lesson.duration_minutes} دقيقة</span>
            </div>

            {/* Start Quiz Button */}
            <button
                onClick={handleStartQuiz}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
                <CheckCircle size={24} />
                إكمال الدرس والانتقال للاختبار
            </button>
        </div>
    );
};
