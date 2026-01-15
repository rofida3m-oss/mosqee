import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Navigate } from 'react-router-dom';
import { Users, MessageSquare, Ban, CheckCircle, Trash2, Shield, Search } from 'lucide-react';

// ==================== Interfaces ====================
interface AssistantLog {
    id: string;
    query: string;
    source: 'ai' | 'offline' | 'duckduckgo' | 'ai_error';
    snippet?: string;
    userId?: string;
    success: boolean;
    createdAt: string;
}

export const AdminSupport = () => {
    const { currentUser, allUsers, supportTickets, toggleUserStatus, deleteUser, replyToTicket } = useApp();
    const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'logs'>('users');
    const [searchTerm, setSearchTerm] = useState('');

    // Reply text per ticket
    const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    // Assistant logs
    const [assistantLogs, setAssistantLogs] = useState<AssistantLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logSearch, setLogSearch] = useState('');
    const [logFilterUser, setLogFilterUser] = useState('');
    const [viewSnippet, setViewSnippet] = useState<string | null>(null);

    // ==================== Security Check ====================
    if (currentUser?.role !== UserRole.ADMIN) {
        return <Navigate to="/" />;
    }

    // ==================== Filtered Users ====================
    const filteredUsers = useMemo(() => {
        return allUsers.filter(u =>
            u.name.includes(searchTerm) ||
            u.phone.includes(searchTerm)
        );
    }, [allUsers, searchTerm]);

    // ==================== Ticket Reply Handler ====================
    const handleReply = (ticketId: string) => {
        const text = replyTextMap[ticketId];
        if (!text?.trim()) return;
        replyToTicket(ticketId, text);
        setReplyTextMap(prev => ({ ...prev, [ticketId]: '' }));
        setSelectedTicketId(null);
    };

    // ==================== Fetch Assistant Logs ====================
    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await (await import('../services/apiService')).default.getAssistantLogs();
            setAssistantLogs(res || []);
        } catch (e) {
            console.error('Failed to fetch assistant logs:', e);
            setAssistantLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    // ==================== Filtered Logs ====================
    const filteredLogs = assistantLogs.filter(l => {
        if (logSearch && !l.query.includes(logSearch)) return false;
        if (logFilterUser && l.userId !== logFilterUser) return false;
        return true;
    });

    // ==================== Clear Logs ====================
    const clearLogs = async () => {
        if (!confirm('هل تريد حذف كل سجلات المساعد؟')) return;
        setAssistantLogs([]);
    };

    const openSnippet = (s: string | null) => { setViewSnippet(s); };

    // ==================== Render ====================
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">لوحة التحكم والدعم الفني</h1>
                        <p className="text-emerald-200">إدارة المستخدمين والرد على الاستفسارات</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                >
                    <Users size={18} />
                    المستخدمين ({allUsers.length})
                </button>
                <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'tickets' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                >
                    <MessageSquare size={18} />
                    الرسائل ({supportTickets.filter(t => t.status === 'open').length})
                </button>
                <button 
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                >
                    <Users size={18} />
                    سجلات المساعد
                </button>
            </div>

            {/* ==================== USERS TAB ==================== */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-4 border-b border-stone-100">
                        <div className="relative">
                            <Search className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="بحث باسم المستخدم أو الهاتف..." 
                                className="w-full pr-10 pl-4 py-2 bg-stone-50 border rounded-lg"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-stone-50 text-stone-500 text-sm">
                                <tr>
                                    <th className="p-4 font-bold">الاسم</th>
                                    <th className="p-4 font-bold">الهاتف</th>
                                    <th className="p-4 font-bold">الدور</th>
                                    <th className="p-4 font-bold">الحالة</th>
                                    <th className="p-4 font-bold text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                                        <td className="p-4 font-bold text-stone-800">{user.name}</td>
                                        <td className="p-4 text-stone-600" dir="ltr">{user.phone}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                                                user.role === UserRole.IMAM ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {user.role === UserRole.ADMIN ? 'مسؤول' : user.role === UserRole.IMAM ? 'إمام' : 'مستخدم'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                    <CheckCircle size={14} /> نشط
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600 text-xs font-bold">
                                                    <Ban size={14} /> محظور
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => toggleUserStatus(user.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                                title={user.isActive ? "حظر" : "تفعيل"}
                                            >
                                                {user.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) deleteUser(user.id) }}
                                                className="p-2 bg-stone-100 text-stone-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="حذف نهائي"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ==================== TICKETS TAB ==================== */}
            {activeTab === 'tickets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supportTickets.length === 0 && <p className="text-stone-500 col-span-2 text-center">لا توجد رسائل</p>}
                    
                    {supportTickets.map(ticket => (
                        <div key={ticket.id} className={`bg-white rounded-2xl p-5 border shadow-sm ${ticket.status === 'open' ? 'border-amber-200' : 'border-stone-100 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-stone-900">{ticket.subject}</h3>
                                    <p className="text-xs text-stone-500">من: {ticket.userName}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                                    {ticket.status === 'open' ? 'جديد' : 'تم الرد'}
                                </span>
                            </div>
                            
                            <div className="bg-stone-50 p-3 rounded-xl text-stone-700 mb-4 text-sm leading-relaxed">
                                {ticket.message}
                            </div>

                            {ticket.reply && (
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-2">
                                    <p className="text-xs font-bold text-emerald-800 mb-1">رد الإدارة:</p>
                                    <p className="text-sm text-emerald-700">{ticket.reply}</p>
                                </div>
                            )}

                            {ticket.status === 'open' && (
                                <div>
                                    {selectedTicketId === ticket.id ? (
                                        <div className="space-y-2 animate-fadeIn">
                                            <textarea 
                                                className="w-full p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                                rows={3}
                                                placeholder="اكتب ردك هنا..."
                                                value={replyTextMap[ticket.id] || ''}
                                                onChange={e => setReplyTextMap(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                            ></textarea>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleReply(ticket.id)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-700">إرسال الرد</button>
                                                <button onClick={() => setSelectedTicketId(null)} className="bg-stone-100 text-stone-600 px-4 py-1.5 rounded-lg text-sm font-bold">إلغاء</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setSelectedTicketId(ticket.id)} className="text-emerald-600 text-sm font-bold hover:underline">
                                            الرد على الرسالة
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
