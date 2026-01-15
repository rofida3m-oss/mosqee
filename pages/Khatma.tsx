import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';
import { Khatma as KhatmaType } from '../types';
import { BookOpen, UserCheck, Lock, Sparkles, X, HeartHandshake, Check, Info, LogIn, History, UserPlus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JUZ_DETAILS = [
    { id: 1, range: "الفاتحة 1 - البقرة 141" },
    { id: 2, range: "البقرة 142 - البقرة 252" },
    { id: 3, range: "البقرة 253 - آل عمران 92" },
    { id: 4, range: "آل عمران 93 - النساء 23" },
    { id: 5, range: "النساء 24 - النساء 147" },
    { id: 6, range: "النساء 148 - المائدة 81" },
    { id: 7, range: "المائدة 82 - الأنعام 110" },
    { id: 8, range: "الأنعام 111 - الأعراف 87" },
    { id: 9, range: "الأعراف 88 - الأنفال 40" },
    { id: 10, range: "الأنفال 41 - التوبة 92" },
    { id: 11, range: "التوبة 93 - هود 5" },
    { id: 12, range: "هود 6 - يوسف 52" },
    { id: 13, range: "يوسف 53 - إبراهيم 52" },
    { id: 14, range: "الحجر 1 - النحل 128" },
    { id: 15, range: "الإسراء 1 - الكهف 74" },
    { id: 16, range: "الكهف 75 - طه 135" },
    { id: 17, range: "الأنبياء 1 - الحج 78" },
    { id: 18, range: "المؤمنون 1 - الفرقان 20" },
    { id: 19, range: "الفرقان 21 - النمل 55" },
    { id: 20, range: "النمل 56 - العنكبوت 45" },
    { id: 21, range: "العنكبوت 46 - الأحزاب 30" },
    { id: 22, range: "الأحزاب 31 - يس 27" },
    { id: 23, range: "يس 28 - الزمر 31" },
    { id: 24, range: "الزمر 32 - فصلت 46" },
    { id: 25, range: "فصلت 47 - الجاثية 37" },
    { id: 26, range: "الأحقاف 1 - الذاريات 30" },
    { id: 27, range: "الذاريات 31 - الحديد 29" },
    { id: 28, range: "المجادلة 1 - التحريم 12" },
    { id: 29, range: "الملك 1 - المرسلات 50" },
    { id: 30, range: "النبأ 1 - الناس 6" },
];

export const Khatma = () => {
    const { currentUser } = useApp();
    const navigate = useNavigate();
    const [khatma, setKhatma] = useState<KhatmaType | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [showDua, setShowDua] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingParts, setLoadingParts] = useState<number[]>([]);
    const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);

    // Create Khatma State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState<'type' | 'friend'>('type');
    const [friends, setFriends] = useState<any[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);

    const createKhatma = async (type: 'personal' | 'private_group', friendId?: string) => {
        if (!currentUser) return;
        try {
            const khatmaId = 'k_' + Date.now();
            const participants = [{ userId: currentUser.id, userName: currentUser.name }];
            let khatmaName = 'ختمة شخصية';

            if (friendId) {
                const friend = friends.find(f => f.id === friendId);
                participants.push({ userId: friendId, userName: friend?.name || 'صديق' });
                khatmaName = `ختمة مشتركة مع ${friend?.name}`;
            }

            await dbQueries.createUserKhatma({
                id: khatmaId,
                type: type,
                ownerId: currentUser.id,
                name: khatmaName,
                participants: participants,
                currentJuz: 0,
                completedParts: [],
                startDate: new Date().toISOString()
            });

            alert('تم إنشاء الختمة بنجاح!');
            setShowCreateModal(false);
            setRefresh(prev => prev + 1);
            setKhatma(null);
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء الإنشاء');
        }
    };

    useEffect(() => {
        if (createStep === 'friend' && showCreateModal && currentUser) {
            setFriendsLoading(true);
            dbQueries.getFollowing(currentUser.id)
                .then(res => setFriends(res || []))
                .catch(() => setFriends([]))
                .finally(() => setFriendsLoading(false));
        }
    }, [createStep, showCreateModal, currentUser]);

    useEffect(() => {
        if (showStats && currentUser) {
            setStatsLoading(true);
            dbQueries.getKhatmaHistory(currentUser.id)
                .then(data => setStats(data || []))
                .catch(err => console.error(err))
                .finally(() => setStatsLoading(false));
        }
    }, [showStats, currentUser]);

    const isPartLoading = (juz: number) => loadingParts.includes(juz);
    const setPartLoading = (juz: number, v: boolean) => setLoadingParts(prev => v ? [...prev, juz] : prev.filter(p => p !== juz));

    useEffect(() => {
        const loadKhatma = async () => {
            if (!currentUser) return;
            try {
                const userKhatmas: any = await dbQueries.getUserKhatmas(currentUser.id);
                if (userKhatmas && userKhatmas.length > 0) {
                    setKhatma(userKhatmas[0]);
                } else {
                    const data = await dbQueries.getKhatma();
                    setKhatma(data);
                }
            } catch (error) {
                console.error('Failed to load khatma:', error);
                setKhatma(null);
            } finally {
                setLoading(false);
            }
        };
        loadKhatma();
    }, [refresh, currentUser]);

    const handleAction = async (juz: number, action: 'take' | 'complete', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!khatma) return;
        if (isPartLoading(juz)) return;
        if (!currentUser) {
            if (window.confirm("يجب تسجيل الدخول أولاً للمشاركة. الذهاب لصفحة الدخول؟")) {
                navigate('/login');
            }
            return;
        }

        try {
            setPartLoading(juz, true);

            if (khatma.type === 'personal') {
                await dbQueries.updateKhatmaProgress(khatma.id, currentUser.id, { currentJuz: juz });
            } else {
                await dbQueries.updateKhatmaProgress(khatma.id, currentUser.id, { partId: juz });
            }
            setRefresh(prev => prev + 1);
            setNotify({ type: 'success', text: `تم تحديث الجزء ${juz} بنجاح.` });
        } catch (error: any) {
            console.error('Failed to update khatma:', error);
            setNotify({ type: 'error', text: error?.message || 'فشل التحديث، حاول مجدداً' });
        } finally {
            setPartLoading(juz, false);
            setTimeout(() => setNotify(null), 4000);
        }
    };

    if (loading) return <div className="p-10 text-center flex items-center justify-center min-h-[50vh]"><span className="animate-pulse">جاري تحميل الختمة...</span></div>;

    if (!khatma) return <div className="p-10 text-center min-h-[50vh] flex items-center justify-center text-red-600">خطأ في تحميل الختمة</div>;

    const progress = khatma.type === 'personal'
        ? Math.round(((khatma.currentJuz || 0) / 30) * 100)
        : Math.round(((khatma.completedParts?.length || 0) / 30) * 100);

    return (
        <div className="space-y-8 relative pb-20">
            {showDua && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                        <button onClick={() => setShowDua(false)} className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <HeartHandshake className="text-emerald-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-6 font-cairo">دعاء ختم القرآن الكريم</h2>
                            <div className="text-lg leading-loose text-stone-700 font-medium space-y-4">
                                <p>اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.</p>
                                <p>اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ.</p>
                                <button onClick={() => setShowDua(false)} className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700">
                                    آمين يا رب العالمين
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-br from-emerald-900 to-teal-800 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden text-center shadow-xl">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-white/20">
                        <Sparkles size={14} className="text-amber-300" />
                        <span>{khatma.name || 'الختمة الحالية'}</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-3 font-cairo">سابقوا إلى مغفرة من ربكم</h1>

                    <div className="max-w-md mx-auto relative mt-6">
                        <div className="flex justify-between text-xs font-bold mb-2 text-emerald-200">
                            <span>البداية</span>
                            <span>{progress}% مكتمل</span>
                        </div>
                        <div className="h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute top-0 right-0 h-full w-2 bg-white/50 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center mt-6 items-center flex-wrap">
                        <button onClick={() => setShowDua(true)} className="text-sm underline text-emerald-200 hover:text-white transition-colors">
                            قراءة دعاء الختم
                        </button>
                        <button onClick={() => setShowStats(true)} className="text-sm underline text-emerald-200 hover:text-white transition-colors">
                            سجل ختماتي
                        </button>
                        <button onClick={() => { setCreateStep('type'); setShowCreateModal(true); }} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-bold transition-colors">
                            ✨ بدء ختمة جديدة
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            </div>

            {showStats && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative p-6">
                        <button onClick={() => setShowStats(false)} className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <History size={24} className="text-emerald-600" />
                            سجل ختماتك
                        </h2>
                        {statsLoading ? (
                            <div className="text-center py-8 text-stone-500">جاري التحميل...</div>
                        ) : stats.length > 0 ? (
                            <div className="space-y-3">
                                {stats.map((s: any, idx) => (
                                    <div key={idx} className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-stone-700">ختمة مكتملة</div>
                                            <div className="text-xs text-stone-500">{new Date(s.completion_date).toLocaleDateString('ar-EG')}</div>
                                        </div>
                                        <div className="text-emerald-600 font-bold bg-white px-3 py-1 rounded-lg shadow-sm text-sm">
                                            {s.duration_days} يوم
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                                <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                                <p>لم تكمل أي ختمة بعد. شد الهمة! 💪</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {notify && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${notify.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : notify.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                    {notify.text}
                </div>
            )}

            {!currentUser && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-amber-800">
                        <Info size={20} />
                        <span className="font-bold text-sm">سجّل دخولك لتتمكن من حجز الأجزاء والمشاركة.</span>
                    </div>
                    <button onClick={() => navigate('/login')} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <LogIn size={16} />
                        دخول
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {JUZ_DETAILS.map((juzInfo) => {
                    const juz = juzInfo.id;
                    let isCompleted = false;
                    let canAction = false;

                    if (khatma.type === 'personal') {
                        const current = khatma.currentJuz || 0;
                        isCompleted = juz <= current;
                        canAction = (juz === current + 1);
                    } else {
                        // Group V2
                        if (Array.isArray(khatma.completedParts)) {
                            isCompleted = khatma.completedParts.some((p: any) => (p.partId === juz || p === juz));
                        }
                        if (!isCompleted) canAction = true;
                    }

                    // Card Style
                    let cardStyle = "bg-white border-stone-200";
                    if (isCompleted) cardStyle = "bg-emerald-50 border-emerald-200 opacity-80";
                    else if (canAction && khatma.type === 'personal') cardStyle = "bg-amber-50 border-amber-300 ring-1 ring-amber-300 shadow-md";

                    return (
                        <div key={juz} className={`relative rounded-xl border p-4 transition-all duration-300 ${cardStyle}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-mono text-sm ${isCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                                        {juz}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-sm">الجزء {juz}</h3>
                                        <p className="text-[10px] text-stone-500 font-medium truncate max-w-[120px]">{juzInfo.range}</p>
                                    </div>
                                </div>
                                {isCompleted && <Check className="text-emerald-600" size={18} />}
                            </div>

                            <div className="mt-2">
                                {isCompleted ? (
                                    <div className="w-full py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg text-center flex items-center justify-center gap-1">
                                        <Check size={14} /> تمت القراءة
                                    </div>
                                ) : canAction ? (
                                    <button
                                        onClick={(e) => handleAction(juz, 'complete', e)}
                                        disabled={isPartLoading(juz)}
                                        className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isPartLoading(juz) ? 'جاري التحديث...' : (khatma.type === 'personal' ? 'أتممت القراءة' : 'قراءة الجزء')}
                                    </button>
                                ) : (
                                    <div className="text-xs text-stone-400 text-center py-2">
                                        {khatma.type === 'personal' ? 'مغلق (بالترتيب)' : 'مغلق'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full hover:bg-stone-200"><X size={20} /></button>

                        <h2 className="text-2xl font-bold text-center mb-6 font-cairo">بدء ختمة جديدة</h2>

                        {createStep === 'type' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => createKhatma('personal')}
                                    className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors flex flex-col items-center gap-4 text-center group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                                        <User size={32} />
                                    </div>
                                    <h3 className="font-bold text-emerald-900">ختمة منفردة</h3>
                                    <p className="text-xs text-stone-500">اقرأ القرآن الكريم كاملاً بمفردك وتتبع إنجازك.</p>
                                </button>

                                <button
                                    onClick={() => setCreateStep('friend')}
                                    className="p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors flex flex-col items-center gap-4 text-center group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <HeartHandshake size={32} />
                                    </div>
                                    <h3 className="font-bold text-blue-900">ختمة مع صديق</h3>
                                    <p className="text-xs text-stone-500">شارك الأجر مع صديق وتقاسما الأجزاء سوياً.</p>
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <UserPlus size={20} className="text-blue-600" />
                                    اختر صديقاً للمشاركة
                                </h3>
                                {friendsLoading ? (
                                    <div className="text-center py-8">جاري تحميل قائمة الأصدقاء...</div>
                                ) : friends.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {friends.map((friend: any) => (
                                            <button
                                                key={friend.id}
                                                onClick={() => createKhatma('private_group', friend.id)}
                                                className="w-full p-3 flex items-center gap-3 bg-stone-50 hover:bg-blue-50 rounded-xl transition-colors border border-stone-100 text-right"
                                            >
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-stone-700 border shadow-sm">
                                                    {friend.name[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-stone-800">{friend.name}</div>
                                                </div>
                                                <div className="text-blue-600 text-xs font-bold bg-white px-3 py-1 rounded-full">
                                                    دعوة
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed text-stone-500">
                                        لا يوجد أصدقاء تتابعهم حالياً للمشاركة.
                                    </div>
                                )}
                                <button onClick={() => setCreateStep('type')} className="mt-4 text-sm text-stone-500 underline hover:text-stone-800 block mx-auto">
                                    العودة للخلف
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};