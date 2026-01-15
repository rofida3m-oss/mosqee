import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { Lesson, Mosque } from '../types';
import { calculateDistance } from '../utils/location';
import { Sparkles, MapPin, Clock, Send, Bot, User, Mic, BookOpen, Sun } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { chatWithAssistant } from '../services/geminiService';

export const SmartAssistant = () => {
    const { currentUser, lessons, mosques, getUserLocation } = useApp();
    const [recommendations, setRecommendations] = useState<{
        nearby: Lesson[];
        upcoming: Lesson[];
    }>({ nearby: [], upcoming: [] });

    // Chat State
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot', text: string, lessons?: Lesson[] }[]>([
        { sender: 'bot', text: 'السلام عليكم ورحمة الله! أنا مساعدك الذكي في "جامع".\nأنا هنا لخدمتك، اسألني عن الساعة، أو أقرب الدروس، أو اطلب حديثاً شريفاً.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentUser?.location) {
            getUserLocation();
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isTyping]);

    useEffect(() => {
        if (currentUser?.location) {
            const now = new Date();

            // Filter Nearby (within 10km)
            const nearby = lessons.filter(l => {
                const mosque = mosques.find(m => m.id === l.mosqueId);
                if (!mosque) return false;
                const dist = calculateDistance(currentUser.location!.lat, currentUser.location!.lng, mosque.location.lat, mosque.location.lng);
                return dist < 10 && new Date(l.date) >= now;
            }).slice(0, 2);

            // Filter Upcoming Today/Tomorrow
            const upcoming = lessons.filter(l => {
                return new Date(l.date) > now;
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 2);

            setRecommendations({ nearby, upcoming });
        }
    }, [currentUser, lessons, mosques]);

    const handleSend = async (e?: React.FormEvent, manualQuery?: string) => {
        if (e) e.preventDefault();

        const messageText = manualQuery || query;
        if (!messageText.trim()) return;

        const userMsg = messageText;
        setQuery('');
        setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
        setIsTyping(true);

        // AI Logic
        try {
            // Fetch user context for better AI response
            let userData = null;
            if (currentUser) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    // Parallel fetch for speed
                    const [goals, tLog] = await Promise.all([
                        dbQueries.getTasbihGoals(currentUser.id).catch(() => null),
                        dbQueries.getTasbihLog(currentUser.id, today).catch(() => null)
                    ]);

                    userData = {
                        name: currentUser.name,
                        dailyGoal: goals?.dailyGoal,
                        dailyCount: tLog?.count || 0,
                        streak: goals?.streak || 0,
                        lastPhrase: tLog?.phrase
                    };
                } catch (err) {
                    console.warn('Failed to fetch user context for AI', err);
                }
            }

            const response = await chatWithAssistant(
                userMsg,
                lessons,
                mosques,
                currentUser?.location, // Pass location here
                userData // Pass user context
            );

            setChatHistory(prev => [...prev, {
                sender: 'bot',
                text: response.reply,
                lessons: response.recommendedLessons.length > 0 ? response.recommendedLessons : undefined
            }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { sender: 'bot', text: "عذراً، حدث خطأ في الاتصال. حاول مرة أخرى." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const QuickAction = ({ icon: Icon, text, queryText }: { icon: any, text: string, queryText: string }) => (
        <button
            onClick={() => handleSend(undefined, queryText)}
            className="flex flex-col items-center justify-center p-4 bg-white border border-stone-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm group"
        >
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-2 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                <Icon size={20} />
            </div>
            <span className="text-xs font-bold text-stone-700">{text}</span>
        </button>
    );

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col md:block md:h-auto">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                </div>
                <div className="relative flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner">
                        <Sparkles className="text-amber-300 w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">مساعدك الذكي</h1>
                        <p className="text-emerald-100 text-sm opacity-90">اسأل عن الدين، الوقت، أو أماكن الدروس</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden md:overflow-visible">

                {/* Quick Actions & Suggestions Sidebar */}
                <div className="lg:col-span-1 space-y-6 hidden md:block overflow-y-auto">
                    {/* Quick Actions */}
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <h3 className="text-sm font-bold text-stone-500 mb-3">إجراءات سريعة</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction icon={MapPin} text="أقرب درس" queryText="أين أقرب درس دين مني؟" />
                            <QuickAction icon={Clock} text="الساعة الآن" queryText="الساعة كام دلوقتي؟" />
                            <QuickAction icon={BookOpen} text="حديث شريف" queryText="أتحفني بحديث شريف عن حسن الخلق" />
                            <QuickAction icon={Sun} text="أذكار" queryText="اذكر لي بعض أذكار الصباح" />
                        </div>
                    </div>

                    {/* Suggestions */}
                    <section>
                        <h2 className="font-bold text-lg text-stone-800 mb-3 flex items-center gap-2">
                            <MapPin size={20} className="text-emerald-600" />
                            اقتراحات قريبة منك
                        </h2>
                        {recommendations.nearby.length > 0 ? (
                            <div className="space-y-3">
                                {recommendations.nearby.map(l => (
                                    <LessonCard key={l.id} lesson={l} mosque={mosques.find(m => m.id === l.mosqueId)} showMosqueName />
                                ))}
                            </div>
                        ) : (
                            <p className="text-stone-500 text-sm bg-white p-4 rounded-xl border border-stone-100">لا توجد دروس قريبة جداً حالياً.</p>
                        )}
                    </section>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-full md:h-[600px] overflow-hidden">
                    <div className="p-4 bg-stone-50 border-b border-stone-100 font-bold text-stone-700 flex items-center gap-2 shrink-0 justify-between">
                        <div className="flex items-center gap-2">
                            <Bot size={20} className="text-emerald-600" />
                            محادثة مباشرة
                        </div>
                        {/* Mobile Quick Actions Toggle (Simplified as icons) */}
                        <div className="md:hidden flex gap-2">
                            <button onClick={() => handleSend(undefined, "الساعة كام؟")} className="p-2 bg-white rounded-full shadow-sm text-stone-500"><Clock size={16} /></button>
                            <button onClick={() => handleSend(undefined, "أقرب درس فين؟")} className="p-2 bg-white rounded-full shadow-sm text-stone-500"><MapPin size={16} /></button>
                        </div>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/50">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
                                <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200 text-emerald-600'}`}>
                                        {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.sender === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                                {msg.lessons && (
                                    <div className="mt-2 w-full space-y-2 max-w-[85%] mr-10">
                                        {msg.lessons.map(l => (
                                            <div key={l.id} className="text-xs">
                                                <LessonCard lesson={l} mosque={mosques.find(m => m.id === l.mosqueId)} showMosqueName />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-1 text-stone-400 text-xs p-2 mr-10">
                                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-150"></span>
                                جاري التفكير...
                            </div>
                        )}
                    </div>

                    <form onSubmit={(e) => handleSend(e)} className="p-3 bg-white border-t border-stone-100 flex gap-2 shrink-0 items-center">
                        <button type="button" className="p-3 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-stone-50 transition-colors">
                            <Mic size={20} />
                        </button>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="اسأل عن درس، حديث، أو الوقت..."
                            className="flex-1 bg-stone-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50" disabled={!query.trim() || isTyping}>
                            <Send size={20} className={isTyping ? "opacity-0" : ""} />
                            {isTyping && <span className="absolute inset-0 flex items-center justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span></span>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};