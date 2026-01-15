import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw, BookOpen, Sparkles } from 'lucide-react';
import { triggerWinConfetti } from '../utils/confetti';

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: number;
    explanation: string;
}

export const LessonQuiz = () => {
    const { lessonId } = useParams();
    const { currentUser } = useApp();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [quizResult, setQuizResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser && lessonId) {
            fetchQuestions();
        }
    }, [currentUser, lessonId]);

    const fetchQuestions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/educational-lessons/${lessonId}/questions`);
            const data = await response.json();
            setQuestions(data);
            setSelectedAnswers(new Array(data.length).fill(-1));
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answerIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answerIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/educational-lessons/${lessonId}/submit-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?.id,
                    answers: selectedAnswers
                })
            });

            const result = await response.json();
            setQuizResult(result);
            setShowResult(true);

            if (result.passed) {
                triggerWinConfetti();
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
        }
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers(new Array(questions.length).fill(-1));
        setShowResult(false);
        setQuizResult(null);
    };

    const handleReviewLesson = () => {
        navigate(`/lessons/${lessonId}`);
    };

    const handleNextLesson = () => {
        if (quizResult?.nextLesson) {
            navigate(`/lessons/${quizResult.nextLesson.id}`);
        } else {
            navigate('/lessons');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (showResult && quizResult) {
        return (
            <div className="space-y-6 pb-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/lessons')}
                        className="w-10 h-10 rounded-xl bg-white border-2 border-stone-100 flex items-center justify-center hover:border-emerald-300 transition-colors"
                    >
                        <ArrowRight size={20} className="text-stone-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-stone-800">نتيجة الاختبار</h1>
                </div>

                <div className={`rounded-3xl p-8 text-center relative overflow-hidden ${quizResult.passed
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                    <div className="relative z-10 text-white">
                        {quizResult.passed ? (
                            <>
                                <Sparkles size={64} className="mx-auto mb-4 animate-pulse" />
                                <h2 className="text-3xl font-bold mb-2">مبروك! لقد نجحت 🎉</h2>
                                <p className="text-white/90 mb-6">أحسنت! لقد أجبت على جميع الأسئلة بشكل صحيح</p>
                            </>
                        ) : (
                            <>
                                <Trophy size={64} className="mx-auto mb-4" />
                                <h2 className="text-3xl font-bold mb-2">حاول مرة أخرى 💪</h2>
                                <p className="text-white/90 mb-6">لم تحصل على العلامة الكاملة، لكن يمكنك المحاولة مرة أخرى</p>
                            </>
                        )}

                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
                            <div className="text-6xl font-bold mb-2">{quizResult.score}/{quizResult.total}</div>
                            <div className="text-sm font-medium">النتيجة</div>
                        </div>

                        {!quizResult.passed && (
                            <div className="mt-4 text-sm">
                                عدد المحاولات: {quizResult.attempts}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {quizResult.passed ? (
                        <>
                            {quizResult.nextLessonUnlocked && quizResult.nextLesson && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
                                    <p className="text-blue-800 font-bold mb-2">🎊 تم فتح الدرس التالي!</p>
                                    <p className="text-blue-700 text-sm">{quizResult.nextLesson.title}</p>
                                </div>
                            )}

                            <button
                                onClick={handleNextLesson}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                {quizResult.nextLessonUnlocked ? 'الانتقال للدرس التالي' : 'العودة للدروس'}
                                <ArrowRight size={20} className="rotate-180" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleReviewLesson}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen size={20} />
                                مراجعة الدرس
                            </button>

                            <button
                                onClick={handleRetry}
                                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20} />
                                إعادة الاختبار
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(`/lessons/${lessonId}`)}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-stone-100 flex items-center justify-center hover:border-emerald-300 transition-colors"
                >
                    <ArrowRight size={20} className="text-stone-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-stone-800">اختبار الدرس</h1>
                    <p className="text-stone-500 text-sm">السؤال {currentQuestionIndex + 1} من {questions.length}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Question */}
            {questions.length > 0 && currentQuestion ? (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                    <h2 className="text-xl font-bold text-stone-800 mb-6 leading-relaxed">
                        {currentQuestion.question_text}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full p-4 text-right rounded-2xl border-2 font-medium transition-all ${selectedAnswers[currentQuestionIndex] === index
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option}</span>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswers[currentQuestionIndex] === index
                                        ? 'border-emerald-500 bg-emerald-500'
                                        : 'border-stone-300'
                                        }`}>
                                        {selectedAnswers[currentQuestionIndex] === index && (
                                            <CheckCircle size={16} className="text-white" fill="currentColor" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                    <p className="text-stone-500 font-bold">لا توجد أسئلة متاحة لهذا الدرس حالياً.</p>
                    <button
                        onClick={() => navigate('/lessons')}
                        className="mt-4 px-6 py-2 bg-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                        العودة للدروس
                    </button>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex-1 py-3 rounded-xl font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    السابق
                </button>

                {currentQuestionIndex === questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedAnswers.includes(-1)}
                        className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        إرسال الإجابات
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestionIndex] === -1}
                        className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        التالي
                    </button>
                )}
            </div>
        </div>
    );
};
