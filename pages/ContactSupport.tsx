import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Headphones } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const ContactSupport = () => {
    const { createSupportTicket, currentUser } = useApp();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!currentUser) return <Navigate to="/" />;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createSupportTicket(subject, message);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 animate-bounce">
                    <Send size={40} />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">تم الإرسال بنجاح</h2>
                <p className="text-stone-600 max-w-md">شكراً لتواصلك معنا. سيقوم فريق الدعم الفني بمراجعة رسالتك والرد عليك في أقرب وقت.</p>
                <button 
                    onClick={() => setSubmitted(false)} 
                    className="mt-8 text-emerald-600 font-bold hover:underline"
                >
                    إرسال رسالة أخرى
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Headphones size={32} />
                </div>
                <h1 className="text-2xl font-bold text-stone-900">تواصل مع الدعم الفني</h1>
                <p className="text-stone-500">نحن هنا لمساعدتك. أخبرنا بمشكلتك أو اقتراحك.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">عنوان الرسالة</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full p-3 bg-stone-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="مثل: مشكلة في تسجيل الدخول"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">نص الرسالة</label>
                    <textarea 
                        required 
                        rows={5}
                        className="w-full p-3 bg-stone-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="اشرح المشكلة بالتفصيل..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Send size={20} />
                    إرسال
                </button>
            </form>
        </div>
    );
};