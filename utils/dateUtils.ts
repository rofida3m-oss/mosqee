export const getHijriDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const getHijriMonthName = (date: Date) => {
     return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        month: 'long',
    }).format(date);
};

export const getDayStatus = (date: Date): string | null => {
    // 1. Get Hijri Components using Intl
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
        day: 'numeric',
        month: 'numeric',
    }).formatToParts(date);
    
    const hDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, 4=Thu

    // Special Occasions
    if (hMonth === 9) return 'شهر رمضان المبارك';
    if (hMonth === 12 && hDay === 9) return 'يوم عرفة (صيام مستحب)';
    if (hMonth === 12 && hDay >= 10 && hDay <= 13) return 'عيد الأضحى (يحرم الصوم)';
    if (hMonth === 10 && hDay === 1) return 'عيد الفطر (يحرم الصوم)';
    if (hMonth === 1 && hDay === 10) return 'عاشوراء (صيام مستحب)';

    // White Days (Ayyam al-Bid)
    if ([13, 14, 15].includes(hDay) && hMonth !== 12) return 'الأيام البيض (صيام مستحب)';

    // Weekly Sunnah
    if (dayOfWeek === 1 || dayOfWeek === 4) return 'سنة الإثنين/الخميس';

    return null;
};

// Keep old function for backward compatibility if needed, using the new logic
export const isOccasion = (date: Date): string | null => getDayStatus(date);