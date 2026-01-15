import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Compass, User, LogOut, MapPin, Building2, Sparkles, X, Bell, Calendar as CalendarIcon, Shield, BookHeart, CircleDot, Briefcase, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { logout, currentUser, notifications, dismissNotification, markNotificationsAsRead } = useApp();

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Compass, label: 'استكشف', path: '/explore' },
    { icon: GraduationCap, label: 'الدروس', path: '/lessons' },
    { icon: CalendarIcon, label: 'التقويم', path: '/calendar' },
    { icon: BookHeart, label: 'الأذكار', path: '/athkar' },
    { icon: CircleDot, label: 'المسبحة', path: '/tasbih' },
    { icon: Briefcase, label: 'خدمات', path: '/services' },
  ];

  if (currentUser?.role === UserRole.IMAM) {
    navItems.push({ icon: Building2, label: 'إدارة المسجد', path: '/manage-mosque' });
  }

  const desktopNavItems = [...navItems];
  if (currentUser?.role === UserRole.ADMIN) {
    desktopNavItems.push({ icon: Shield, label: 'لوحة التحكم', path: '/admin' });
  }

  const mobileNavItems = [
    navItems[0], // الرئيسية
    navItems[1], // استكشف
    navItems[2], // الدروس
    navItems[6], // خدمات
  ];

  if (currentUser?.role === UserRole.ADMIN) {
    mobileNavItems.push({ icon: Shield, label: 'الإدارة', path: '/admin' });
  } else {
    mobileNavItems.push({ icon: User, label: 'حسابي', path: '/profile' });
  }

  desktopNavItems.push({ icon: User, label: 'حسابي', path: '/profile' });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen bg-stone-100 flex flex-col md:flex-row relative ${currentUser?.preferences?.largeFont ? 'text-lg' : 'text-base'}`}>
      <div className="fixed top-4 left-4 z-[60] flex flex-col gap-2 w-full max-w-sm px-4 md:px-0 pointer-events-none">
        {notifications.slice(0, 3).map(note => (
          <div
            key={note.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border-r-4 flex items-start justify-between animate-fadeIn bg-white ${note.type === 'alert' ? 'border-amber-500' :
              note.type === 'success' ? 'border-emerald-500' : 'border-blue-500'
              }`}
          >
            <div className="flex gap-3">
              <div className={`mt-1 p-1 rounded-full ${note.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                note.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                <Bell size={16} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900">{note.title}</h4>
                <p className="text-xs text-stone-600 mt-1">{note.message}</p>
              </div>
            </div>
            <button onClick={() => dismissNotification(note.id)} className="text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <aside className="hidden md:flex flex-col w-64 bg-emerald-800 text-white sticky top-0 h-screen p-6 shadow-xl z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-white/20 p-2 rounded-lg">
            <MapPin className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-cairo">mosqee masr</h1>
            <p className="text-xs text-emerald-200">تصميم وتطوير: علي محمود</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-white text-emerald-900 font-bold shadow-md'
                  : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/smart-assistant"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 border border-emerald-600/50 bg-emerald-700/30 hover:bg-emerald-700 ${pathname === '/smart-assistant' ? 'bg-emerald-700 ring-2 ring-emerald-400' : ''
              }`}
          >
            <Sparkles size={20} className="text-amber-300" />
            <span className="text-amber-100 font-bold">المساعد الذكي</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-emerald-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={currentUser?.image || '/user.png'} alt={currentUser?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-emerald-300">
                {currentUser?.role === UserRole.ADMIN ? 'مسؤول النظام' : currentUser?.role === UserRole.IMAM ? 'إمام مسجد' : 'مستخدم عادي'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            <span>تسجيل خروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={currentUser?.image || '/user.png'} alt={currentUser?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-emerald-900 text-lg">mosqee masr</h1>
              <p className="text-xs text-emerald-600">تصميم وتطوير: علي محمود</p>
            </div>
          </div>
          <button className="relative p-2 text-stone-500" onClick={markNotificationsAsRead}>
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 relative">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-emerald-600' : 'text-stone-400'
                  }`}
              >
                <Icon size={24} fill={isActive ? "currentColor" : "none"} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 ${mobileNavItems.length > 4 ? 'hidden' : ''}`}>
            <Link
              to="/smart-assistant"
              className="w-14 h-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-white border-4 border-stone-100"
            >
              <Sparkles size={24} fill="currentColor" className="text-amber-300" />
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};
