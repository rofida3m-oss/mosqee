import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { PrayerLog } from '../types';
import { Check, Sparkles } from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

export const PrayerTracker = () => {
    const { currentUser, prayerTimes, nextPrayer } = useApp();
    const today = new Date().toISOString().split('T')[0];
    const [log, setLog] = useState<PrayerLog>({
        userId: currentUser?.id || '',
        date: today,
        fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false
    });

    // Load prayer log when user changes
    useEffect(() => {
        const loadLog = async () => {
            if (currentUser?.id) {
                const todayStr = new Date().toISOString().split('T')[0];
                try {
                    const saved = await dbQueries.getPrayerLog(currentUser.id, todayStr);
                    if (saved) {
                        setLog(saved);
                    } else {
                        setLog(prev => ({ ...prev, userId: currentUser.id, date: todayStr }));
                    }
                } catch (error) {
                    console.error('Failed to load prayer log:', error);
                    setLog(prev => ({ ...prev, userId: currentUser.id, date: todayStr }));
                }
            }
        };
        loadLog();
    }, [currentUser?.id]);

    const togglePrayer = (prayer: keyof PrayerLog) => {
        if (prayer === 'userId' || prayer === 'date') return;

        const newLog = { ...log, [prayer]: !log[prayer] };

        // Check if we are completing the last one
        const currentState = { ...log };
        const newState = { ...newLog };

        // If we are toggling to TRUE
        if (newState[prayer] === true) {
            // Count how many are true in newState
            const completedCount = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(p => newState[p as keyof PrayerLog] === true).length;

            if (completedCount === 5) {
                triggerConfetti();
            }
        }

        setLog(newLog);

        const updateAsync = async () => {
            try {
                await dbQueries.updatePrayerLog(newLog);
            } catch (error) {
                console.error('Failed to update prayer log:', error);
            }
        };
        updateAsync();
    };

    if (!prayerTimes) return null;

    const prayers = [
        { key: 'fajr', label: 'الفجر', time: prayerTimes.Fajr },
        { key: 'dhuhr', label: 'الظهر', time: prayerTimes.Dhuhr },
        { key: 'asr', label: 'العصر', time: prayerTimes.Asr },
        { key: 'maghrib', label: 'المغرب', time: prayerTimes.Maghrib },
        { key: 'isha', label: 'العشاء', time: prayerTimes.Isha },
    ];

    const completedCount = Object.values(log).filter(v => v === true).length;
    const progress = (completedCount / 5) * 100;

    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-800">صلواتي اليوم</h3>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                    {completedCount} / 5
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-100 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex justify-between items-center relative">
                {prayers.map((p) => {
                    const isDone = log[p.key as keyof PrayerLog];
                    const isNext = nextPrayer?.name === p.label;

                    return (
                        <div key={p.key} className="flex flex-col items-center gap-2 relative">
                            {isNext && (
                                <div className="absolute -top-3 animate-bounce text-amber-500">
                                    <Sparkles size={12} fill="currentColor" />
                                </div>
                            )}
                            <button
                                onClick={() => togglePrayer(p.key as keyof PrayerLog)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                                    : isNext
                                        ? 'bg-white border-amber-400 text-stone-400 ring-2 ring-amber-100 ring-offset-1'
                                        : 'bg-white border-stone-200 text-stone-300 hover:border-emerald-300'
                                    }`}
                            >
                                <Check size={16} />
                            </button>
                            <div className="text-center">
                                <span className={`text-xs font-bold block ${isNext ? 'text-amber-600' : 'text-stone-700'}`}>{p.label}</span>
                                <span className="text-[10px] text-stone-400 font-mono">{p.time}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {nextPrayer && (
                <div className="mt-4 pt-3 border-t border-stone-50 text-center text-xs text-stone-500">
                    متبقي على صلاة <span className="font-bold text-stone-700">{nextPrayer.name}</span> حوالي {nextPrayer.remainingMinutes > 60 ? `${Math.floor(nextPrayer.remainingMinutes / 60)} ساعة` : `${nextPrayer.remainingMinutes} دقيقة`}
                </div>
            )}
        </div>
    );
};