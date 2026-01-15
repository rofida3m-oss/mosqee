import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Play, ChevronLeft, Trophy, Users } from 'lucide-react';
import APIService from '../services/apiService';

interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    questions?: Question[];
}

interface ChallengeModalProps {
    challengeId: string;
    userId: string;
    onClose: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ challengeId, userId, onClose }) => {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [participated, setParticipated] = useState(false);
    const [previousAttempt, setPreviousAttempt] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                // Check participation first
                const checkData = await APIService.request<any>(`/challenges/${challengeId}/check/${userId}`);
                if (checkData.participated) {
                    setParticipated(true);
                    setPreviousAttempt(checkData.attempt);
                    setScore(checkData.attempt.score);
                    // Fetch leaderboard too
                    const lbData = await APIService.request<any[]>(`/challenges/${challengeId}/leaderboard`);
                    setLeaderboard(lbData || []);
                }

                const data = await APIService.request<Challenge>(`/challenges/${challengeId}`);
                if (data && data.questions) {
                    data.questions = data.questions.map((q: any) => ({
                        ...q,
                        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                    }));
                }
                setChallenge(data);
            } catch (error) {
                console.error('Error loading challenge:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [challengeId, userId]);


    const handleAnswer = (optionIndex: number) => {
        if (!challenge?.questions || selectedOption !== null) return;

        const currentQ = challenge.questions[currentQuestionIndex];
        setSelectedOption(optionIndex);

        const isCorrect = optionIndex === currentQ.correctAnswer;
        let newScore = score;
        if (isCorrect) {
            newScore = score + 1;
            setScore(newScore);
        }

        setAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));

        // Move to next question after short delay to show feedback
        setTimeout(() => {
            setSelectedOption(null);
            if (currentQuestionIndex < (challenge.questions!.length - 1)) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                // Pass the current score directly to avoid stale closure
                finishChallenge(newScore);
            }
        }, 1500);
    };

    const finishChallenge = async (finalScore?: number) => {
        if (!challenge?.questions) return;

        // Use the passed score if available, otherwise use state
        const scoreToSubmit = finalScore !== undefined ? finalScore : score;
        setCompleted(true);

        // Submit to API
        try {
            await APIService.request(`/challenges/${challengeId}/submit`, {
                method: 'POST',
                body: JSON.stringify({
                    id: 'att_' + Date.now(),
                    userId,
                    challengeId,
                    score: scoreToSubmit,
                    totalQuestions: challenge.questions.length,
                    answers: answers
                })
            });
            // Refresh leaderboard
            const lbData = await APIService.request<any[]>(`/challenges/${challengeId}/leaderboard`);
            setLeaderboard(lbData || []);
        } catch (error) {
            console.error('Error submitting challenge:', error);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
        );
    }

    if (!challenge) return null;

    if (completed || participated) {
        const finalScore = participated ? previousAttempt?.score : score;
        const totalQ = challenge.questions?.length || 1;
        const percentage = (finalScore / totalQ) * 100;

        if (showLeaderboard) {
            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 relative overflow-hidden flex flex-col max-h-[80vh]">
                        <button onClick={onClose} className="absolute top-4 left-4 text-stone-400 hover:text-stone-600">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                            <Trophy className="text-amber-500" size={24} />
                            لوحة المتصدرين
                        </h2>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {leaderboard.map((entry, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-stone-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'}`}>
                                            {idx + 1}
                                        </span>
                                        <span className="font-bold text-stone-800">{entry.user_name}</span>
                                    </div>
                                    <div className="text-sm font-bold text-emerald-600">
                                        {entry.score}/{entry.total_questions}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowLeaderboard(false)}
                            className="mt-6 w-full py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
                        >
                            عودة للنتيجة
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-8 text-center relative overflow-hidden">
                    {participated && <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold">تمت المشاركة مسبقاً</div>}
                    <div className="relative z-10">
                        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${percentage >= 80 ? 'bg-emerald-100 text-emerald-600' :
                            percentage >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                            }`}>
                            <Trophy size={40} />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">
                            {percentage >= 80 ? 'ممتاز!' :
                                percentage >= 50 ? 'جيد جداً!' : 'حظاً أوفر!'}
                        </h2>

                        <p className="text-stone-600 mb-6">
                            لقد أجبت بشكل صحيح على {finalScore} من {totalQ} سؤال
                        </p>

                        <div className="text-4xl font-bold text-stone-800 mb-8">
                            {Math.round(percentage)}%
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setShowLeaderboard(true)}
                                className="w-full py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Users size={20} />
                                عرض المتصدرين
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl p-6 relative">
                    <button onClick={onClose} className="absolute top-4 left-4 text-stone-400 hover:text-stone-600">
                        <X size={24} />
                    </button>

                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                            <Trophy size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>
                        <p className="text-stone-500 mb-6">{challenge.description}</p>

                        <div className="flex items-center justify-center gap-2 text-sm text-stone-400 mb-8">
                            <span>{challenge.questions?.length || 0} أسئلة</span>
                            <span>•</span>
                            <span>تحدي {challenge.questions?.length ? 'تفاعلي' : 'سريع'}</span>
                        </div>

                        <button
                            onClick={() => setStarted(true)}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Play size={20} fill="currentColor" />
                            بدء التحدي
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = challenge.questions![currentQuestionIndex];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                    <div className="text-sm font-bold text-stone-400">
                        السؤال {currentQuestionIndex + 1} من {challenge.questions?.length}
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Question */}
                <div className="p-8 text-center flex-1 overflow-y-auto">
                    <h3 className="text-xl font-bold text-stone-800 mb-8 leading-relaxed">
                        {currentQuestion.questionText}
                    </h3>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrect = idx === currentQuestion.correctAnswer;
                            const showResult = selectedOption !== null;

                            let buttonClass = 'border-stone-100 text-stone-600 hover:border-emerald-200 hover:bg-stone-50';
                            if (showResult) {
                                if (isCorrect) buttonClass = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
                                else if (isSelected) buttonClass = 'border-red-500 bg-red-50 text-red-700 font-bold';
                                else buttonClass = 'border-stone-100 text-stone-300 opacity-50';
                            }

                            return (
                                <div key={idx} className="relative">
                                    <button
                                        disabled={showResult}
                                        onClick={() => handleAnswer(idx)}
                                        className={`w-full p-4 rounded-xl border-2 text-right transition-all transform active:scale-95 flex items-center justify-between ${buttonClass}`}
                                    >
                                        <span>{option}</span>
                                        {showResult && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                                        {showResult && isSelected && !isCorrect && <AlertCircle className="text-red-500" size={20} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {selectedOption !== null && currentQuestion.explanation && (
                        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-right animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-xs font-bold text-emerald-800 mb-1">توضيح:</p>
                            <p className="text-sm text-emerald-700 leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                    )}
                </div>

                {/* Progress */}
                <div className="h-2 bg-stone-100 w-full">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / (challenge.questions?.length || 1)) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default ChallengeModal;
