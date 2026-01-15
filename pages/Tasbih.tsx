import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import {
    RotateCcw, Volume2, VolumeX, CheckCircle, Plus, Sparkles, BookHeart, History,
    Target, Trophy, Zap, Moon, Sun, Star, Heart, Trash2, Award, ChevronLeft, ChevronRight, Edit2
} from 'lucide-react';
import { useToast } from '@chakra-ui/react';
import { triggerConfetti, triggerSmallBurst } from '../utils/confetti';
import "./style.css"

interface TasbihLog {
    date: string;
    phrase: string;
    count: number;
}

export const Tasbih = () => {
    const { currentUser } = useApp();
    const today = new Date().toISOString().split('T')[0];

    // State
    const [count, setCount] = useState(0);
    const [lifetimeCount, setLifetimeCount] = useState(0);
    const [currentPhrase, setCurrentPhrase] = useState('سبحان الله');
    const [target, setTarget] = useState(33);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrateEnabled, setVibrateEnabled] = useState(true);
    const [isCustomInput, setIsCustomInput] = useState(false);
    const [customPhraseInput, setCustomPhraseInput] = useState('');
    const [isTargetReached, setIsTargetReached] = useState(false);
    const [streak, setStreak] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(100);
    const [dailyLogs, setDailyLogs] = useState<TasbihLog[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [autoReset, setAutoReset] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(100);

    // Animation states
    const [isPressed, setIsPressed] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const lastSavedRef = useRef<string>('');

    // Pending clicks tracking for lifetime stats
    const pendingClicks = useRef(0);

    const PRESETS = useMemo(() => [
        {
            label: 'سبحان الله',
            count: 33,
            icon: <Star size={16} className="text-blue-500" />,
            description: 'التسبيح'
        },
        {
            label: 'الحمد لله',
            count: 33,
            icon: <Sun size={16} className="text-amber-500" />,
            description: 'الحمد'
        },
        {
            label: 'الله أكبر',
            count: 33,
            icon: <Target size={16} className="text-red-500" />,
            description: 'التكبير'
        },
        {
            label: 'لا إله إلا الله',
            count: 100,
            icon: <Trophy size={16} className="text-emerald-500" />,
            description: 'التوحيد'
        },
        {
            label: 'أستغفر الله',
            count: 100,
            icon: <Moon size={16} className="text-indigo-500" />,
            description: 'الاستغفار'
        },
        {
            label: 'اللهم صلِّ على محمد',
            count: 10,
            icon: <Heart size={16} className="text-pink-500" />,
            description: 'الصلاة على النبي'
        },
        {
            label: 'سبحان الله وبحمده',
            count: 100,
            icon: <Sparkles size={16} className="text-purple-500" />,
            description: 'التسبيح والتحميد'
        },
        {
            label: 'حسبي الله ونعم الوكيل',
            count: 7,
            icon: <Zap size={16} className="text-yellow-500" />,
            description: 'التوكل'
        },
    ], []);

    // Load data from database
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) return;

            try {
                // Load V2 Advanced Goals & Stats
                const goals = await dbQueries.getTasbihGoals(currentUser.id);
                if (goals) {
                    setDailyGoal(goals.dailyGoal || 100);
                    setTempGoal(goals.dailyGoal || 100);
                    setStreak(goals.streak || 0);
                    setLifetimeCount(goals.totalLifetime || 0);
                }

                // Load today's log for current session context
                const log = await dbQueries.getTasbihLog(currentUser.id, today);
                if (log) {
                    setCount(log.count);
                    setCurrentPhrase(log.phrase);
                    setTarget(log.target || 33);
                }

                // Load settings
                const soundSetting = localStorage.getItem('tasbih_sound');
                if (soundSetting !== null) setSoundEnabled(soundSetting === 'true');

                const vibrateSetting = localStorage.getItem('tasbih_vibrate');
                if (vibrateSetting !== null) setVibrateEnabled(vibrateSetting === 'true');

                const autoResetSetting = localStorage.getItem('tasbih_auto_reset');
                if (autoResetSetting !== null) setAutoReset(autoResetSetting === 'true');

                const notificationsSetting = localStorage.getItem('tasbih_notifications');
                if (notificationsSetting !== null) setNotifications(notificationsSetting === 'true');

                // Load recent logs
                const logs = await dbQueries.getRecentTasbihLogs(currentUser.id, 7);
                setDailyLogs(logs || []);

            } catch (error) {
                console.error('Failed to load tasbih data:', error);
            }
        };

        loadData();
    }, [currentUser, today]);

    // Save settings and goal
    useEffect(() => {
        localStorage.setItem('tasbih_sound', soundEnabled.toString());
        localStorage.setItem('tasbih_vibrate', vibrateEnabled.toString());
        localStorage.setItem('tasbih_auto_reset', autoReset.toString());
        localStorage.setItem('tasbih_notifications', notifications.toString());

        // Save Goal to DB
        if (currentUser) {
            const timeout = setTimeout(() => {
                dbQueries.setTasbihGoal(currentUser.id, dailyGoal).catch(console.error);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [soundEnabled, vibrateEnabled, autoReset, notifications, dailyGoal, currentUser]);

    // Debounced save to database
    useEffect(() => {
        const saveData = async () => {
            if (!currentUser) return;

            const saveKey = `${currentUser.id}_${today}_${currentPhrase}_${count}`;
            if (saveKey === lastSavedRef.current) return;

            try {
                // Just save the current session log here.
                await dbQueries.saveTasbihLog(
                    currentUser.id,
                    currentPhrase,
                    count,
                    target,
                    count >= target
                );

                // Live Update: Refresh the history log display
                try {
                    const recent = await dbQueries.getRecentTasbihLogs(currentUser.id, 7);
                    if (recent) setDailyLogs(recent);
                } catch (e) {
                    // ignore
                }

                lastSavedRef.current = saveKey;

            } catch (error) {
                console.error('Failed to save tasbih log:', error);
            }
        };

        const timeoutId = setTimeout(saveData, 1000);
        return () => clearTimeout(timeoutId);
    }, [count, currentPhrase, target, currentUser, today]);

    // Dedicated effect to flush pending lifetime clicks
    useEffect(() => {
        const flush = setInterval(async () => {
            if (pendingClicks.current > 0) {
                const toAdd = pendingClicks.current;
                pendingClicks.current = 0;
                try {
                    await dbQueries.updateTasbihStats(currentUser!.id, toAdd);
                } catch (e) {
                    console.error('Failed to update lifetime stats:', e);
                    pendingClicks.current += toAdd; // Put them back if failed
                }
            }
        }, 2000);
        return () => clearInterval(flush);
    }, [currentUser]);

    // Check for target reached
    useEffect(() => {
        if (count > 0 && count % target === 0) {
            setIsTargetReached(true);

            // Celebration effects
            if (soundEnabled && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }

            if (vibrateEnabled && navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 100]);
            }

            // Celebration effect
            triggerConfetti();

            // Auto-reset if enabled
            if (autoReset) {
                setTimeout(() => {
                    setCount(0);
                    setIsTargetReached(false);
                }, 3000);
            }
        } else {
            setIsTargetReached(false);
        }
    }, [count, target, soundEnabled, vibrateEnabled, autoReset]);

    // Daily notifications
    useEffect(() => {
        if (!notifications || !currentUser) return;

        const checkDailyReminder = () => {
            const now = new Date();
            const hour = now.getHours();

            const reminderHours = [5, 12, 15, 18, 21];

            if (reminderHours.includes(hour)) {
                const lastReminder = localStorage.getItem(`tasbih_reminder_${hour}`);
                if (lastReminder !== today) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تذكير بالتسبيح', {
                            body: `حان وقت الذكر! ${currentPhrase}`,
                            icon: '/favicon.ico'
                        });
                    }

                    localStorage.setItem(`tasbih_reminder_${hour}`, today);
                }
            }
        };

        const interval = setInterval(checkDailyReminder, 60000);
        return () => clearInterval(interval);
    }, [notifications, currentUser, today, currentPhrase]);

    const increment = useCallback(() => {
        // Prepare side effects outside of the functional update to avoid double execution in StrictMode
        if (vibrateEnabled && navigator.vibrate) {
            navigator.vibrate(20);
        }

        if (soundEnabled) {
            const audio = new Audio('/click.mp3');
            audio.volume = 0.2;
            audio.play().catch(() => { });
        }

        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);

        // Update state
        setCount(prev => prev + 1);
        setLifetimeCount(prev => prev + 1);
        pendingClicks.current += 1;

        // Visual feedback based on new theoretical count
        setCount(currentCount => {
            const newCount = currentCount; // Functional update will execute this
            if (newCount % (target === 33 ? 11 : 33) === 0 && newCount !== target && newCount !== 0) {
                triggerSmallBurst();
            }
            return newCount;
        });
    }, [soundEnabled, vibrateEnabled, target]);

    const reset = useCallback(() => {
        setCount(0);
        setIsTargetReached(false);

        if (vibrateEnabled && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, [vibrateEnabled]);

    const selectPreset = useCallback((preset: typeof PRESETS[0]) => {
        setCurrentPhrase(preset.label);
        setTarget(preset.count);
        setCount(0);
        setIsCustomInput(false);
        setIsTargetReached(false);
    }, []);

    const setCustom = useCallback(() => {
        if (customPhraseInput.trim()) {
            setCurrentPhrase(customPhraseInput);
            setTarget(100);
            setCount(0);
            setIsCustomInput(false);
            setCustomPhraseInput('');
        }
    }, [customPhraseInput]);

    const clearHistory = useCallback(async () => {
        if (window.confirm('هل تريد حذف كل سجلات التسبيح؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            if (currentUser) {
                try {
                    await dbQueries.clearTasbihLogs(currentUser.id);
                    setCount(0);
                    setLifetimeCount(0);
                    setStreak(0);
                    setDailyLogs([]);
                } catch (error) {
                    console.error('Failed to clear history:', error);
                }
            }
        }
    }, [currentUser]);

    const progressPercentage = useMemo(() => {
        return Math.min((count % target) / target * 100, 100);
    }, [count, target]);

    const dailyProgressPercentage = useMemo(() => {
        const totalToday = dailyLogs
            .filter(l => l.date === today)
            .reduce((sum, l) => sum + l.count, 0);
        return Math.min((totalToday / dailyGoal) * 100, 100);
    }, [dailyLogs, dailyGoal, today]);

    const todayGlobalTotal = useMemo(() => {
        // Find other logs for today (excluding the current phrase which we show via 'count')
        const otherLogsTotal = dailyLogs
            .filter(l => l.date === today && l.phrase !== currentPhrase)
            .reduce((sum, l) => sum + l.count, 0);

        return otherLogsTotal + count;
    }, [dailyLogs, today, currentPhrase, count]);

    const handleSaveGoal = async () => {
        if (tempGoal < 1) return;
        setDailyGoal(tempGoal);
        setIsEditingGoal(false);
        if (currentUser) {
            await dbQueries.setTasbihGoal(currentUser.id, tempGoal).catch(console.error);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 px-4 pb-24 font-sans">
            <audio ref={audioRef} src="/success-sound.mp3" preload="auto" />

            {/* Header / Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-sm text-center">
                    <span className="text-xs text-stone-400 block mb-1 font-bold">اليوم</span>
                    <span className="text-xl font-black text-emerald-600 font-mono">{todayGlobalTotal}</span>
                </div>
                <button
                    onClick={() => {
                        setTempGoal(dailyGoal);
                        setIsEditingGoal(true);
                    }}
                    className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-sm text-center hover:bg-white transition-colors group relative"
                >
                    <span className="text-xs text-stone-400 block mb-1 font-bold group-hover:text-emerald-600 transition-colors">الهدف</span>
                    <span className="text-xl font-black text-amber-500 font-mono">{dailyGoal}</span>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={10} className="text-stone-300" />
                    </div>
                </button>
                <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-sm text-center">
                    <span className="text-xs text-stone-400 block mb-1 font-bold">المجموع</span>
                    <span className="text-xl font-black text-blue-500 font-mono">{lifetimeCount.toLocaleString()}</span>
                </div>
            </div>

            {/* Editing Goal Modal */}
            {isEditingGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-xs shadow-2xl animate-scaleIn border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-800">تعديل هدف اليوم</h3>
                            <p className="text-sm text-stone-400 mt-1">كم مرة تود التسبيح اليوم؟</p>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setTempGoal(Math.max(10, tempGoal - 10))}
                                className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <input
                                type="number"
                                value={tempGoal}
                                onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                                className="flex-1 text-center text-3xl font-black text-emerald-600 bg-stone-50 rounded-xl py-3 border-none focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                            <button
                                onClick={() => setTempGoal(tempGoal + 10)}
                                className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditingGoal(false)}
                                className="flex-1 py-4 px-2 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSaveGoal}
                                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                            >
                                حفظ الهدف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Glassmorphism Card */}
            <div className="relative">
                {/* Decorative Background Blobs */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-40 h-40 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-40 h-40 bg-lime-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-8 shadow-2xl overflow-hidden min-h-[500px] flex flex-col items-center justify-between">

                    {/* Top Controls */}
                    <div className="w-full flex justify-between items-center text-stone-500">
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-100/50 text-emerald-600' : 'hover:bg-white/50'}`}>
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button onClick={reset} className="p-2 rounded-full hover:bg-white/50 hover:text-red-500 transition-colors">
                            <RotateCcw size={20} />
                        </button>
                    </div>

                    {/* Display Area */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full my-8">
                        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                            {/* Dynamic Progress Ring */}
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="120"
                                    fill="none"
                                    stroke={isTargetReached ? "#fbbf24" : "#10b981"}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progressPercentage * 7.54} 754`}
                                    className="transition-all duration-300 ease-out"
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-black text-stone-800 font-mono tracking-tighter drop-shadow-sm">
                                    {count}
                                </span>
                                <span className="text-sm font-bold text-stone-400 mt-2">
                                    / {target}
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-stone-800 drop-shadow-sm mb-2 px-4 leading-relaxed">
                                {currentPhrase}
                            </h2>
                            {isTargetReached && (
                                <div className="animate-bounce inline-block bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-bold">
                                    اكتمل الهدف!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Action Button */}
                    <button
                        ref={buttonRef}
                        onClick={increment}
                        className={`w-full py-6 rounded-2xl text-white text-xl font-bold shadow-lg transition-all transform active:scale-[0.98] ${isTargetReached
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                            } ${isPressed ? 'scale-95' : ''}`}
                    >
                        {isTargetReached ? 'بداية جديدة' : 'سبح'}
                    </button>

                </div>
            </div>

            {/* Presets Slide */}
            <div className="relative">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-stone-700">تسابيح مختارة</h3>
                    <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-bold text-emerald-600">
                        {showHistory ? 'إخفاء السجل' : 'عرض السجل'}
                    </button>
                </div>

                {showHistory ? (
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 space-y-3 max-h-60 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-stone-500">آخر النشاطات</h4>
                            <button onClick={clearHistory} className="text-xs text-red-500">مسح</button>
                        </div>
                        {dailyLogs.map((log, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                                <span className="font-bold text-sm text-stone-600">{log.phrase}</span>
                                <span className="font-mono font-bold text-emerald-600">{log.count}</span>
                            </div>
                        ))}
                        {dailyLogs.length === 0 && <p className="text-center text-stone-400 text-sm">لا يوجد سجل</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {PRESETS.map((p, idx) => (
                            <button
                                key={idx}
                                onClick={() => selectPreset(p)}
                                className={`p-4 rounded-2xl text-right transition-all border ${currentPhrase === p.label
                                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                    : 'bg-white border-stone-100 hover:border-emerald-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-lg">{p.icon}</div>
                                    <span className="text-xs font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{p.count}</span>
                                </div>
                                <div className="font-bold text-stone-700 text-sm">{p.label}</div>
                            </button>
                        ))}
                        <button
                            onClick={() => setIsCustomInput(!isCustomInput)}
                            className="p-4 rounded-2xl border border-dashed border-stone-300 hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-emerald-600"
                        >
                            <Plus size={24} />
                            <span className="text-sm font-bold">إضافة ذكر</span>
                        </button>
                    </div>
                )}

                {isCustomInput && (
                    <div className="mt-4 bg-white p-4 rounded-3xl shadow-lg border border-stone-100 animate-slideUp">
                        <h4 className="font-bold text-stone-700 mb-3">ذكر جديد</h4>
                        <div className="flex gap-2">
                            <input
                                value={customPhraseInput}
                                onChange={e => setCustomPhraseInput(e.target.value)}
                                placeholder="اكتب الذكر هنا..."
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button onClick={setCustom} className="bg-emerald-600 text-white px-6 rounded-xl font-bold">حفظ</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};