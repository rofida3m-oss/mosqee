import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calculator, CircleDot, BookHeart, BookOpen, Users, Radio, Sparkles } from 'lucide-react';

export const Services = () => {
    const services = [
        {
            title: 'المصحف الشريف',
            desc: 'تلاوة القرآن الكريم',
            icon: BookOpen,
            color: 'bg-emerald-100 text-emerald-600',
            path: '/quran'
        },
        {
            title: 'إذاعة القرآن',
            desc: 'بث مباشر من القاهرة ومكة',
            icon: Radio,
            color: 'bg-stone-100 text-stone-600',
            path: '/radio'
        },
        {
            title: 'أسماء الله الحسنى',
            desc: 'تعلم الأسماء ومعانيها',
            icon: Sparkles,
            color: 'bg-amber-100 text-amber-600',
            path: '/asmaul-husna'
        },
        {
            title: 'الختمة الجماعية',
            desc: 'شارك في ختم القرآن مع المجتمع',
            icon: Users,
            color: 'bg-teal-100 text-teal-600',
            path: '/khatma'
        },
        {
            title: 'اتجاه القبلة',
            desc: 'تحديد اتجاه الكعبة المشرفة بدقة',
            icon: Compass,
            color: 'bg-blue-100 text-blue-600',
            path: '/qibla'
        },
        {
            title: 'حاسبة الزكاة',
            desc: 'حساب زكاة المال بدقة وسهولة',
            icon: Calculator,
            color: 'bg-rose-100 text-rose-600',
            path: '/zakat'
        },
        {
            title: 'المسبحة',
            desc: 'عداد إلكتروني للأذكار والتسبيح',
            icon: CircleDot,
            color: 'bg-green-100 text-green-600',
            path: '/tasbih'
        },
        {
            title: 'الأذكار',
            desc: 'أذكار الصباح والمساء والنوم',
            icon: BookHeart,
            color: 'bg-purple-100 text-purple-600',
            path: '/athkar'
        },
        {
            title: 'تحديات دينية',
            desc: 'نافس أصدقائك في مسابقات ومعلومات',
            icon: Sparkles,
            color: 'bg-amber-100 text-amber-600',
            path: '/challenges'
        },
        {
            title: 'المنشورات المحفوظة',
            desc: 'المنشورات التي قمت بحفظها للرجوع إليها',
            icon: BookHeart,
            color: 'bg-emerald-100 text-emerald-600',
            path: '/saved-posts'
        },
    ];



    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-emerald-900">الخدمات والأدوات</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, idx) => (
                    <Link to={service.path} key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                            <service.icon size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-stone-800 mb-1">{service.title}</h3>
                            <p className="text-sm text-stone-500">{service.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};