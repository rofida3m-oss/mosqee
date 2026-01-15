import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Phone, User as UserIcon, Lock, Moon, MapPin, Building2, UserCircle2, Shield } from 'lucide-react';

type AuthMode = 'login' | 'register';
type RegisterRole = 'user' | 'mosque';

export const Login = () => {
  const { login, registerUser, registerMosque } = useApp();
  
  // State
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: OTP
  const [isAdminLogin, setIsAdminLogin] = useState(false); // New: Admin Toggle
  
  // Form Data
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // User Name or Imam Name
  const [mosqueName, setMosqueName] = useState('');
  const [mosqueAddress, setMosqueAddress] = useState('');
  const [otp, setOtp] = useState('');

  const resetForm = () => {
    setStep(1);
    setRole(null);
    setPhone('');
    setName('');
    setMosqueName('');
    setMosqueAddress('');
    setOtp('');
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setIsAdminLogin(false);
    resetForm();
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      if (mode === 'login') {
        login(name || (isAdminLogin ? 'مسؤول النظام' : 'مستخدم عائد'), phone, isAdminLogin);
      } else {
        if (role === 'user') {
          registerUser(name, phone);
        } else if (role === 'mosque') {
          registerMosque({
            name: mosqueName,
            imamName: name,
            address: mosqueAddress,
            phone: phone
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 transition-all duration-500">
        <div className="bg-emerald-50 p-6 text-center relative">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg transform rotate-3">
                <Moon className="text-white w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-emerald-900">أهلاً بك في جامع</h1>
            
            {/* Tabs */}
            <div className="flex bg-white/50 p-1 rounded-xl mt-6 border border-emerald-100/50">
                <button
                    onClick={() => handleModeSwitch('login')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:bg-white/50'
                    }`}
                >
                    تسجيل دخول
                </button>
                <button
                    onClick={() => handleModeSwitch('register')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        mode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500 hover:bg-white/50'
                    }`}
                >
                    إنشاء حساب
                </button>
            </div>
        </div>

        <div className="p-6">
            {/* REGISTER: Role Selection */}
            {mode === 'register' && step === 1 && !role && (
                <div className="space-y-4">
                    <p className="text-center text-stone-600 mb-2 font-medium">اختر نوع الحساب</p>
                    <button onClick={() => setRole('user')} className="w-full p-4 rounded-xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <UserCircle2 size={24} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-stone-800">مستخدم عادي</h3>
                            <p className="text-xs text-stone-500">للبحث عن المساجد وحضور الدروس</p>
                        </div>
                    </button>
                    
                    <button onClick={() => setRole('mosque')} className="w-full p-4 rounded-xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Building2 size={24} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-stone-800">إمام / إدارة جامع</h3>
                            <p className="text-xs text-stone-500">لإدارة صفحة المسجد ونشر الدروس</p>
                        </div>
                    </button>
                </div>
            )}

            {/* FORMS */}
            {((mode === 'login') || (mode === 'register' && role)) && step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-4 animate-fadeIn">
                     {/* Go Back button for register role selection */}
                     {mode === 'register' && (
                        <button type="button" onClick={() => setRole(null)} className="text-stone-400 text-sm flex items-center gap-1 hover:text-emerald-600 mb-2">
                            <ArrowLeft size={14} />
                            <span>تغيير نوع الحساب</span>
                        </button>
                     )}

                    {/* Login Fields */}
                    {mode === 'login' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">رقم الهاتف</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        required
                                        dir="ltr"
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right"
                                        placeholder="01xxxxxxxxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                             {/* Admin Toggle Checkbox */}
                            <div className="flex items-center gap-2 mt-2">
                                <input 
                                    type="checkbox" 
                                    id="admin-check"
                                    checked={isAdminLogin}
                                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                                />
                                <label htmlFor="admin-check" className="text-sm text-stone-500 flex items-center gap-1">
                                    <Shield size={14} />
                                    دخول كمسؤول (تجريبي)
                                </label>
                            </div>
                        </>
                    )}

                    {/* Register User Fields */}
                    {mode === 'register' && role === 'user' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">الاسم الكامل</label>
                                <div className="relative">
                                    <UserIcon className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="مثل: أحمد محمد"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">رقم الهاتف</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        required
                                        dir="ltr"
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right"
                                        placeholder="01xxxxxxxxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Register Mosque Fields */}
                    {mode === 'register' && role === 'mosque' && (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">اسم المسجد</label>
                                <div className="relative">
                                    <Building2 className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="مثل: مسجد النور"
                                        value={mosqueName}
                                        onChange={(e) => setMosqueName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">اسم الإمام / المسؤول</label>
                                <div className="relative">
                                    <UserIcon className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="اسمك بالكامل"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">العنوان</label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="المنطقة، الشارع"
                                        value={mosqueAddress}
                                        onChange={(e) => setMosqueAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">رقم هاتف التواصل</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        required
                                        dir="ltr"
                                        className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right"
                                        placeholder="01xxxxxxxxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all mt-4"
                    >
                        المتابعة
                    </button>
                </form>
            )}

            {/* OTP Step (Common) */}
            {step === 2 && (
                <form onSubmit={handleVerify} className="space-y-6 animate-fadeIn">
                     <div className="text-center">
                        <h3 className="font-bold text-lg text-emerald-900 mb-2">التحقق من الرقم</h3>
                        <p className="text-stone-600 text-sm">أدخل الرمز المرسل إلى <span dir="ltr" className="font-bold text-stone-800">{phone}</span></p>
                    </div>
                    
                    <div className="flex justify-center gap-2" dir="ltr">
                        <input
                            type="text"
                            maxLength={4}
                            className="w-full text-center text-3xl tracking-[1em] font-bold py-3 border-b-2 border-emerald-500 focus:outline-none bg-transparent"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all"
                    >
                        {mode === 'login' ? 'دخول' : 'تأكيد الحساب'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-stone-500 text-sm hover:text-emerald-600 flex items-center justify-center gap-1"
                    >
                        <ArrowLeft size={14} />
                        تعديل البيانات
                    </button>
                </form>
            )}
        </div>
      </div>
      
      <p className="mt-8 text-emerald-200/60 text-xs">جميع الحقوق محفوظة © جامع 2024</p>
    </div>
  );
};