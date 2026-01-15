import React, { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

const SURAHS = [
    { id: 1, name: 'الفاتحة', verses: 7, type: 'مكية' },
    { id: 2, name: 'البقرة', verses: 286, type: 'مدنية' },
    { id: 3, name: 'آل عمران', verses: 200, type: 'مدنية' },
    { id: 4, name: 'النساء', verses: 176, type: 'مدنية' },
    { id: 5, name: 'المائدة', verses: 120, type: 'مدنية' },
    { id: 6, name: 'الأنعام', verses: 165, type: 'مكية' },
    { id: 7, name: 'الأعراف', verses: 206, type: 'مكية' },
    { id: 8, name: 'الأنفال', verses: 75, type: 'مدنية' },
    { id: 9, name: 'التوبة', verses: 129, type: 'مدنية' },
    { id: 10, name: 'يونس', verses: 109, type: 'مكية' },
    { id: 11, name: 'هود', verses: 123, type: 'مكية' },
    { id: 12, name: 'يوسف', verses: 111, type: 'مكية' },
    { id: 18, name: 'الكهف', verses: 110, type: 'مكية' },
    { id: 20, name: 'طه', verses: 135, type: 'مكية' },
    { id: 36, name: 'يس', verses: 83, type: 'مكية' },
    { id: 55, name: 'الرحمن', verses: 78, type: 'مدنية' },
    { id: 56, name: 'الواقعة', verses: 96, type: 'مكية' },
    { id: 67, name: 'الملك', verses: 30, type: 'مكية' },
    { id: 112, name: 'الإخلاص', verses: 4, type: 'مكية' },
    { id: 113, name: 'الفلق', verses: 5, type: 'مكية' },
    { id: 114, name: 'الناس', verses: 6, type: 'مكية' },
];

export const QuranReader = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSurahs = SURAHS.filter(s => s.name.includes(searchTerm) || s.id.toString().includes(searchTerm));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-emerald-900 text-center">المصحف الشريف</h1>
            
            <div className="relative">
                <Search className="absolute right-3 top-3.5 text-stone-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="ابحث عن سورة..." 
                    className="w-full pr-10 pl-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                {filteredSurahs.length > 0 ? (
                    filteredSurahs.map((s) => (
                        <a 
                            key={s.id} 
                            href={`https://quran.com/${s.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-between p-4 border-b border-stone-100 last:border-0 hover:bg-emerald-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-stone-100 text-stone-600 font-mono font-bold flex items-center justify-center rounded-lg group-hover:bg-emerald-200 group-hover:text-emerald-800 transition-colors">
                                    {s.id}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-stone-800">سورة {s.name}</h3>
                                    <p className="text-xs text-stone-500">{s.type} • {s.verses} آية</p>
                                </div>
                            </div>
                            <BookOpen size={20} className="text-stone-300 group-hover:text-emerald-600" />
                        </a>
                    ))
                ) : (
                    <div className="p-8 text-center text-stone-500">
                        لا توجد سورة بهذا الاسم
                    </div>
                )}
                
                <div className="p-4 text-center text-sm text-stone-500 bg-stone-50">
                    تم عرض أبرز السور. القائمة الكاملة ستتوفر قريباً.
                </div>
            </div>
        </div>
    );
};