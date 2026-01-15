import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { getHijriDate, getHijriMonthName, getDayStatus } from '../utils/dateUtils';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';

export const Calendar = () => {
    const { lessons, mosques, currentUser } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [userChallenges, setUserChallenges] = useState<any[]>([]);

    useEffect(() => {
        if (currentUser) {
            dbQueries.getChallengeHistory(currentUser.id).then(res => {
                if (res) setUserChallenges(res);
            });
        }
    }, [currentUser]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startDayOffset = (firstDayOfMonth + 1) % 7;

    const days = [];
    for (let i = 0; i < startDayOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const today = new Date();

    const [selectedDate, setSelectedDate] = useState<Date>(today);

    const lessonsForSelectedDate = lessons.filter(l => {
        const d = new Date(l.date);
        return d.getDate() === selectedDate.getDate() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear();
    });

    const dayStatus = getDayStatus(selectedDate);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-900 mb-1">التقويم الإسلامي</h1>
                    <p className="text-stone-500">{getHijriDate(today)}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                    <CalendarIcon className="text-emerald-600 w-8 h-8" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-full"><ChevronRight /></button>
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-stone-800">
                                {currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                            </h2>
                            <p className="text-sm text-emerald-600 font-medium">
                                {getHijriMonthName(currentDate)}
                            </p>
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map(d => (
                            <div key={d} className="text-xs font-bold text-stone-400">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {days.map((date, idx) => {
                            if (!date) return <div key={idx} className="aspect-square"></div>;

                            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
                            const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
                            const status = getDayStatus(date);
                            const isFasting = status?.includes('صيام') || status?.includes('رمضان');

                            const dateStr = date.toDateString();

                            const hasLesson = lessons.some(l => {
                                if (!currentUser?.registeredLessons.includes(l.id)) return false;
                                const ld = new Date(l.date);
                                return ld.toDateString() === dateStr;
                            });

                            const hasChallenge = userChallenges.some(c => {
                                const cd = new Date(c.created_at);
                                return cd.toDateString() === dateStr;
                            });

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(date)}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border ${isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105'
                                        : isToday
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                            : 'bg-white text-stone-700 border-stone-100 hover:border-emerald-300'
                                        }`}
                                >
                                    <span className="text-sm">{date.getDate()}</span>
                                    <div className="flex gap-0.5 absolute bottom-1.5">
                                        {isFasting && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                                        {hasLesson && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                                        {hasChallenge && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg opacity-90 mb-1">التاريخ المحدد</h3>
                            <p className="text-3xl font-bold mb-2">{getHijriDate(selectedDate)}</p>

                            {dayStatus ? (
                                <div className="mt-4 bg-amber-500/20 border border-amber-400/30 p-3 rounded-xl flex items-center gap-2">
                                    <Sparkles className="text-amber-300 w-5 h-5 shrink-0" />
                                    <span className="font-bold text-amber-100 text-sm">{dayStatus}</span>
                                </div>
                            ) : (
                                <p className="mt-4 text-emerald-200/60 text-sm">لا توجد مناسبة خاصة</p>
                            )}
                        </div>
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-600 rounded-full blur-2xl opacity-50"></div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 h-full">
                        <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <CalendarIcon size={18} className="text-emerald-600" />
                            دروس هذا اليوم
                        </h3>
                        {lessonsForSelectedDate.length > 0 ? (
                            <div className="space-y-3">
                                {lessonsForSelectedDate.map(l => (
                                    <div key={l.id} className="text-xs">
                                        <LessonCard lesson={l} mosque={mosques.find(m => m.id === l.mosqueId)} showMosqueName />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-stone-400 text-sm">
                                لا توجد دروس مجدولة
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};