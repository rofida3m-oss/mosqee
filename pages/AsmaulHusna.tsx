import React, { useState } from 'react';
import { Search, Info, Sparkles, BookOpen } from 'lucide-react';

const NAMES = [
    { name: "الله", meaning: "الاسم الجامع للذات الإلهية، لا يسمى به غيره" },
    { name: "الرحمن", meaning: "ذو الرحمة الشاملة التي وسعت كل شيء" },
    { name: "الرحيم", meaning: "ذو الرحمة الخاصة بالمؤمنين" },
    { name: "الملك", meaning: "المتصرف في ملكه كيف يشاء" },
    { name: "القدوس", meaning: "المنزه عن كل نقص وعيب" },
    { name: "السلام", meaning: "الذي سلم من كل عيب، وسلم خلقه من الظلم" },
    { name: "المؤمن", meaning: "المصدق لرسله، والذي أمن خلقه من عذابه" },
    { name: "المهيمن", meaning: "الرقيب الحافظ لكل شيء" },
    { name: "العزيز", meaning: "القوي الغالب الذي لا يغلب" },
    { name: "الجبار", meaning: "الذي يجبر الكسير، ويقهر الجبابرة" },
    { name: "المتكبر", meaning: "المتعالي عن صفات الخلق" },
    { name: "الخالق", meaning: "المبدع للكائنات من العدم" },
    { name: "البارئ", meaning: "الذي خلق الخلق بريئاً من التفاوت" },
    { name: "المصور", meaning: "الذي صور المخلوقات في أحسن صورة" },
    { name: "الغفار", meaning: "الكثير المغفرة للذنوب" },
    { name: "القهار", meaning: "الذي قهر كل شيء وخضع له" },
    { name: "الوهاب", meaning: "الذي يعطي بلا عوض ولا غرض" },
    { name: "الرزاق", meaning: "خالق الأرزاق وموصلها لخلقه" },
    { name: "الفتاح", meaning: "الذي يفتح أبواب الرحمة والرزق" },
    { name: "العليم", meaning: "الذي أحاط علمه بكل شيء" },
    { name: "القابض", meaning: "الذي يقبض الرزق والأرواح" },
    { name: "الباسط", meaning: "الذي يبسط الرزق لمن يشاء" },
    { name: "الخافض", meaning: "الذي يخفض الجبابرة والمتكبرين" },
    { name: "الرافع", meaning: "الذي يرفع المؤمنين بالطاعة" },
    { name: "المعز", meaning: "الذي يعز من يشاء" },
    { name: "المذل", meaning: "الذي يذل من يشاء" },
    { name: "السميع", meaning: "الذي يسمع كل شيء" },
    { name: "البصير", meaning: "الذي يبصر كل شيء" },
    { name: "الحكم", meaning: "الذي يحكم بين خلقه بالعدل" },
    { name: "العدل", meaning: "الذي لا يظلم أحداً" },
    { name: "اللطيف", meaning: "الذي يلطف بعباده ويرفق بهم" },
    { name: "الخبير", meaning: "العالم ببواطن الأمور" },
    { name: "الحليم", meaning: "الذي لا يعجل بالعقوبة" },
    { name: "العظيم", meaning: "الذي له كمال العظمة" },
    { name: "الغفور", meaning: "الذي يغفر الذنوب" },
    { name: "الشكور", meaning: "الذي يشكر القليل من العمل" },
    { name: "العلي", meaning: "المرتفع فوق خلقه" },
    { name: "الكبير", meaning: "الذي له كمال الكبرياء" },
    { name: "الحفيظ", meaning: "الذي يحفظ كل شيء" },
    { name: "المقيت", meaning: "الذي يعطي كل مخلوق قوته" },
    { name: "الحسيب", meaning: "الكافي لعباده" },
    { name: "الجليل", meaning: "العظيم الشأن" },
    { name: "الكريم", meaning: "الكثير الخير والعطاء" },
    { name: "الرقيب", meaning: "المراقب لجميع الأشياء" },
    { name: "المجيب", meaning: "الذي يجيب دعاء من دعاه" },
    { name: "الواسع", meaning: "الذي وسع كل شيء رحمة وعلماً" },
    { name: "الحكيم", meaning: "الذي يضع كل شيء في موضعه" },
    { name: "الودود", meaning: "المحب لعباده المحبوب في قلوبهم" },
    { name: "المجيد", meaning: "الذي له كمال المجد" },
    { name: "الباعث", meaning: "الذي يبعث الموتى" },
    { name: "الشهيد", meaning: "الذي لا يغيب عنه شيء" },
    { name: "الحق", meaning: "الثابت الذي لا يزول" },
    { name: "الوكيل", meaning: "الذي يتوكل عليه في الأمور" },
    { name: "القوي", meaning: "الذي له كمال القوة" },
    { name: "المتين", meaning: "الشديد الذي لا يلحقه ضعف" },
    { name: "الولي", meaning: "الناصر والمعين" },
    { name: "الحميد", meaning: "المستحق للحمد والثناء" },
    { name: "المحصي", meaning: "الذي أحصى كل شيء" },
    { name: "المبدئ", meaning: "الذي بدأ الخلق" },
    { name: "المعيد", meaning: "الذي يعيد الخلق بعد الموت" },
    { name: "المحيي", meaning: "الذي يحيي الموتى" },
    { name: "المميت", meaning: "الذي يميت الأحياء" },
    { name: "الحي", meaning: "الدائم الباقي الذي لا يموت" },
    { name: "القيوم", meaning: "القائم بتدبير خلقه" },
    { name: "الواجد", meaning: "الذي لا يعوزه شيء" },
    { name: "الماجد", meaning: "الذي له كمال المجد والشرف" },
    { name: "الواحد", meaning: "المتفرد في ذاته وصفاته" },
    { name: "الصمد", meaning: "السيد الذي يصمد إليه في الحوائج" },
    { name: "القادر", meaning: "الذي له كمال القدرة" },
    { name: "المقتدر", meaning: "الذي له كمال الاقتدار" },
    { name: "المقدم", meaning: "الذي يقدم من يشاء" },
    { name: "المؤخر", meaning: "الذي يؤخر من يشاء" },
    { name: "الأول", meaning: "الذي ليس قبله شيء" },
    { name: "الآخر", meaning: "الذي ليس بعده شيء" },
    { name: "الظاهر", meaning: "الذي ظهر فوق كل شيء" },
    { name: "الباطن", meaning: "العالم ببواطن الأمور" },
    { name: "الوالي", meaning: "المتولي لأمور خلقه" },
    { name: "المتعالي", meaning: "المتعالي عن صفات المخلوقين" },
    { name: "البر", meaning: "المحسن إلى خلقه" },
    { name: "التواب", meaning: "الذي يتوب على عباده" },
    { name: "المنتقم", meaning: "الذي ينتقم من أعدائه" },
    { name: "العفو", meaning: "الذي يعفو عن الذنوب" },
    { name: "الرؤوف", meaning: "الذي رأفته أعم من رحمته" },
    { name: "مالك الملك", meaning: "المتصرف في ملكه كيف يشاء" },
    { name: "ذو الجلال والإكرام", meaning: "المستحق للتعظيم والإجلال" },
    { name: "المقسط", meaning: "العادل في حكمه" },
    { name: "الجامع", meaning: "الذي يجمع الخلق ليوم الحساب" },
    { name: "الغني", meaning: "الذي لا يحتاج إلى أحد" },
    { name: "المغني", meaning: "الذي يغني من يشاء" },
    { name: "المانع", meaning: "الذي يمنع ما يشاء" },
    { name: "الضار", meaning: "الذي يقدر الضر على من يشاء" },
    { name: "النافع", meaning: "الذي يقدر النفع لمن يشاء" },
    { name: "النور", meaning: "الذي نور السماوات والأرض" },
    { name: "الهادي", meaning: "الذي يهدي من يشاء" },
    { name: "البديع", meaning: "الذي أبدع الخلق على غير مثال" },
    { name: "الباقي", meaning: "الدائم الذي لا يفنى" },
    { name: "الوارث", meaning: "الذي يرث الأرض ومن عليها" },
    { name: "الرشيد", meaning: "الذي أرشد الخلق إلى مصالحهم" },
    { name: "الصبور", meaning: "الذي لا يعجل بالعقوبة" }
];

export const AsmaulHusna = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedName, setSelectedName] = useState<number | null>(null);

    const filteredNames = NAMES.filter(n =>
        n.name.includes(searchTerm) || n.meaning.includes(searchTerm)
    );

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="bg-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 font-cairo">أسماء الله الحسنى</h1>
                    <p className="text-emerald-50 text-lg mb-2 font-arabic">وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا</p>
                    <p className="text-emerald-100 text-sm">الأعراف: 180</p>

                    <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block">
                        <div className="text-5xl font-bold mb-1">99</div>
                        <div className="text-sm font-medium text-emerald-100">اسماً من أسماء الله</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="ابحث عن اسم أو معنى..."
                    className="w-full pr-12 pl-4 py-4 bg-white border-2 border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm text-lg transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900 mb-1">فضل حفظ أسماء الله الحسنى</h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                        قال رسول الله ﷺ: «إن لله تسعة وتسعين اسماً، مائة إلا واحداً، من أحصاها دخل الجنة»
                    </p>
                </div>
            </div>

            {/* Names Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredNames.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedName(selectedName === idx ? null : idx)}
                        className={`relative group cursor-pointer transition-all duration-300 ${selectedName === idx ? 'scale-105 z-10' : 'hover:scale-105'
                            }`}
                    >
                        <div className={`rounded-2xl p-5 shadow-lg border-2 transition-all ${selectedName === idx
                                ? 'bg-emerald-600 border-emerald-500 shadow-2xl shadow-emerald-200'
                                : 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-xl'
                            }`}>
                            {/* Number Badge */}
                            <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${selectedName === idx
                                    ? 'bg-white text-emerald-600'
                                    : 'bg-emerald-600 text-white'
                                }`}>
                                {idx + 1}
                            </div>

                            {/* Name */}
                            <div className="text-center mb-3">
                                <h2 className={`text-3xl font-bold font-cairo transition-colors ${selectedName === idx ? 'text-white' : 'text-emerald-700'
                                    }`}>
                                    {item.name}
                                </h2>
                            </div>

                            {/* Meaning */}
                            <div className={`transition-all duration-300 overflow-hidden ${selectedName === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="pt-3 border-t-2 border-white/30">
                                    <p className="text-white text-sm leading-relaxed text-center">
                                        {item.meaning}
                                    </p>
                                </div>
                            </div>

                            {/* Info Icon */}
                            {selectedName !== idx && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1 text-xs text-stone-400">
                                        <Info size={12} />
                                        <span>اضغط للمعنى</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredNames.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={24} className="text-stone-400" />
                    </div>
                    <p className="text-stone-500">لا توجد نتائج للبحث</p>
                </div>
            )}

            {/* Footer Note */}
            <div className="text-center text-stone-500 text-sm bg-stone-50 rounded-2xl p-4">
                <p className="mb-1">💡 اضغط على أي اسم لمعرفة معناه</p>
                <p className="text-xs text-stone-400">عدد النتائج: {filteredNames.length} من 99</p>
            </div>
        </div>
    );
};