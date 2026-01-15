import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, RotateCcw, Volume2, VolumeX,
    Moon, Sun, Coffee, BookOpen, Clock, Zap, Sparkles, Building2, Bed, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { ATHKAR_DATA, AthkarCategory } from '../data/athkarData';
import { CircularProgress } from '../components/CircularProgress';

export const Athkar = () => {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<AthkarCategory>('morning');
    const [progress, setProgress] = useState<any>({});
    const [globalTotal, setGlobalTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Auto-Select Tab based on Time
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 12) setActiveTab('morning');
        else if (hour >= 14 && hour < 21) setActiveTab('evening');
        else if (hour >= 21 || hour < 4) setActiveTab('sleep');
    }, []);

    const currentAthkar = ATHKAR_DATA[activeTab];
    const totalItems = currentAthkar.length;
    const completedItems = currentAthkar.filter(t => (progress[`${activeTab}-${t.id}`] || 0) >= t.count).length;
    const isCategoryComplete = completedItems === totalItems;

    // Load saved progress
    useEffect(() => {
        const loadProgress = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Load current tab progress
            const log = await dbQueries.getAthkarLog(currentUser.id, today, activeTab);
            if (log) setProgress(log.progress);
            else setProgress({});

            // Load global total for today
            const tabs: AthkarCategory[] = ['morning', 'evening', 'prayer', 'sleep', 'waking'];
            const allLogs = await Promise.all(tabs.map(t => dbQueries.getAthkarLog(currentUser!.id, today, t)));
            const total = allLogs.reduce((acc, log) => {
                if (!log || !log.progress) return acc;
                // Assuming log.progress is { [key: string]: number }
                const tabTotal = Object.values(log.progress).reduce((tabAcc: number, val: any) => tabAcc + (Number(val) || 0), 0);
                return acc + tabTotal;
            }, 0);
            setGlobalTotal(total);

            setIsLoading(false);
        };
        loadProgress();
    }, [activeTab, currentUser]); // Removed 'today' from dependencies as it's calculated inside

    // Save progress
    useEffect(() => {
        const saveProgress = async () => {
            if (!currentUser) return;
            try {
                // Remove saving from here to avoid excessive writes?
                // Or keep debounced. Ideally we assume dbQueries handles it well.
                // Re-implementing simplified save logic relative to original
                await dbQueries.saveAthkarLog(currentUser.id, activeTab, progress);
            } catch (error) {
                console.error('Failed to save athkar progress:', error);
            }
        };
        const timer = setTimeout(saveProgress, 1000);
        return () => clearTimeout(timer);
    }, [progress, currentUser, activeTab]);

    const handleCount = (id: number, max: number) => {
        const key = `${activeTab}-${id}`;
        const current = progress[key] || 0;
        if (current < max) {
            setProgress(prev => ({ ...prev, [key]: current + 1 }));
            setGlobalTotal(prev => prev + 1); // Increment global total
            if (navigator.vibrate) navigator.vibrate(15);
        }
    };

    const handleReset = () => {
        if (!window.confirm('هل تريد إعادة تعيين هذا القسم؟')) return;
        const newProgress = { ...progress };
        let decrementedTotal = globalTotal;
        // Clear only current tab items
        currentAthkar.forEach(t => {
            const key = `${activeTab}-${t.id}`;
            if (newProgress[key]) {
                decrementedTotal -= newProgress[key];
                delete newProgress[key];
            }
        });
        setProgress(newProgress);
        setGlobalTotal(decrementedTotal < 0 ? 0 : decrementedTotal); // Ensure total doesn't go negative
    };

    const TabButton = ({ id, label, icon: Icon }: { id: AthkarCategory, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl text-sm font-bold transition-all min-w-[85px] ${activeTab === id
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-200 scale-105'
                : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100'
                }`}
        >
            <Icon size={20} className="mb-1.5" />
            {label}
        </button>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="text-center relative">
                <h1 className="text-3xl font-extrabold text-emerald-900 mb-2 font-cairo">أذكار المسلم</h1>
                <p className="text-stone-500 text-sm">حصن المسلم اليومي</p>

                {/* Global Stats Pill */}
                <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
                        <Sparkles size={12} className="animate-pulse" />
                        <span>إجمالي اليوم: {globalTotal}</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1 justify-start md:justify-center">
                <TabButton id="morning" label="الصباح" icon={Sun} />
                <TabButton id="evening" label="المساء" icon={Moon} />
                <TabButton id="prayer" label="الصلاة" icon={Building2} />
                <TabButton id="sleep" label="النوم" icon={Bed} />
                <TabButton id="waking" label="الاستيقاظ" icon={Coffee} />
            </div>

            {/* Info Banner & Actions */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors duration-500 ${isCategoryComplete
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                : 'bg-white border-stone-100 shadow-sm'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${activeTab === 'morning' ? 'bg-amber-100 text-amber-600' :
                        activeTab === 'evening' ? 'bg-blue-100 text-blue-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-stone-800">
                            {activeTab === 'morning' ? 'أذكار الصباح' :
                                activeTab === 'evening' ? 'أذكار المساء' :
                                    activeTab === 'prayer' ? 'أذكار بعد الصلاة' :
                                        activeTab === 'sleep' ? 'أذكار النوم' : 'أذكار الاستيقاظ'}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1">
                            {completedItems} من {totalItems} مكتملة
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleReset}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="إعادة تعيين"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            <div className="grid gap-4">
                {currentAthkar.map(thikr => {
                    const key = `${activeTab}-${thikr.id}`;
                    const count = progress[key] || 0;
                    const isDone = count >= thikr.count;

                    return (
                        <div
                            key={thikr.id}
                            onClick={() => handleCount(thikr.id, thikr.count)}
                            className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 border-2 cursor-pointer select-none group ${isDone
                                ? 'bg-emerald-50/80 border-emerald-200'
                                : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-emerald-100 active:scale-[0.99]'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Text Content */}
                                <div className="flex-1">
                                    <p className={`text-xl md:text-2xl leading-loose font-medium font-cairo ${isDone ? 'text-emerald-800' : 'text-stone-800'
                                        }`}>
                                        {thikr.text}
                                    </p>
                                    <p className="text-xs text-stone-400 mt-4 font-bold">
                                        المعدل المطلوب: {thikr.count}
                                    </p>
                                </div>

                                {/* Circular Progress Action */}
                                <div className="shrink-0 flex items-center justify-center pt-1">
                                    <CircularProgress
                                        value={count}
                                        max={thikr.count}
                                        size={70}
                                        strokeWidth={5}
                                        showCheckOnComplete
                                    >
                                        <div className={`font-bold text-lg ${isDone ? 'text-emerald-600' : 'text-stone-400'}`}>
                                            {isDone ? <Check size={28} strokeWidth={3} /> : count}
                                        </div>
                                    </CircularProgress>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isCategoryComplete && (
                <div className="text-center py-8 animate-fadeIn">
                    <div className="inline-block p-4 rounded-full bg-emerald-100 text-emerald-600 mb-3 text-4xl">
                        🎉
                    </div>
                    <h3 className="text-xl font-bold text-emerald-800">تقبل الله طاعتكم</h3>
                    <p className="text-emerald-600">أتممت أذكار هذا القسم بنجاح</p>
                </div>
            )}
        </div>
    );
};