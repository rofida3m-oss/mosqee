import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Mosque, Lesson } from '../types';
import { Navigate } from 'react-router-dom';
import { Building2, PlusCircle, Calendar, Megaphone, Settings, Clock, AlignLeft, Upload, MapPin, ExternalLink, Check, QrCode, Users, X, Edit2, Trash2, PlayCircle, PauseCircle, HelpCircle } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { PostCard } from '../components/PostCard';
import ChallengeCreator from '../components/ChallengeCreator';
import APIService from '../services/apiService';
import { Trophy, Globe, Lock } from 'lucide-react';

type Tab = 'dashboard' | 'add_lesson' | 'add_post' | 'challenges' | 'settings' | 'qrcode' | 'attendees';

export const ManageMosque = () => {
    const { currentUser, mosques, lessons, posts, addLesson, addPost, updateMosque, allUsers } = useApp();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // Check permissions
    if (!currentUser || currentUser.role !== UserRole.IMAM || !currentUser.managedMosqueId) {
        return <Navigate to="/" />;
    }

    const myMosque = mosques.find(m => m.id === currentUser.managedMosqueId);
    const myLessons = lessons.filter(l => l.mosqueId === currentUser.managedMosqueId);
    const myPosts = posts.filter(p => p.mosqueId === currentUser.managedMosqueId);

    if (!myMosque) return <div>لم يتم العثور على المسجد</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-100 relative group">
                    <img src={myMosque.image || '/imagemosqee.jfif'} alt={myMosque.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-right flex-1">
                    <h1 className="text-2xl font-bold text-emerald-900">{myMosque.name}</h1>
                    <p className="text-stone-500 mb-4">{myMosque.address}</p>
                    <div className="flex justify-center md:justify-start gap-8">
                        <div className="text-center">
                            <span className="block font-bold text-xl text-emerald-700">{myMosque.followersCount}</span>
                            <span className="text-xs text-stone-500">متابع</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-emerald-700">{myLessons.length}</span>
                            <span className="text-xs text-stone-500">درس</span>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-xl text-emerald-700">{myPosts.length}</span>
                            <span className="text-xs text-stone-500">منشور</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    لوحة التحكم
                </button>
                <button
                    onClick={() => setActiveTab('attendees')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'attendees' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <Users size={18} />
                    الحضور
                </button>
                <button
                    onClick={() => setActiveTab('add_lesson')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'add_lesson' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <PlusCircle size={18} />
                    إضافة درس
                </button>
                <button
                    onClick={() => setActiveTab('add_post')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'add_post' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <Megaphone size={18} />
                    نشر إعلان
                </button>
                <button
                    onClick={() => setActiveTab('challenges')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'challenges' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <Trophy size={18} />
                    التحديات
                </button>
                <button
                    onClick={() => setActiveTab('qrcode')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'qrcode' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <QrCode size={18} />
                    رمز المسجد
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                >
                    <Settings size={18} />
                    إعدادات المسجد
                </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 min-h-[400px]">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-stone-800">
                                <Calendar className="text-emerald-600" size={20} />
                                الدروس القادمة
                            </h2>
                            {myLessons.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {myLessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}
                                </div>
                            ) : (
                                <p className="text-stone-500 text-sm">لم تقم بإضافة دروس بعد.</p>
                            )}
                        </div>
                        <div className="border-t border-stone-100 pt-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-stone-800">
                                <Megaphone className="text-emerald-600" size={20} />
                                آخر المنشورات
                            </h2>
                            {myPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {myPosts.map(post => <PostCard key={post.id} post={post} mosque={myMosque} />)}
                                </div>
                            ) : (
                                <p className="text-stone-500 text-sm">لم تقم بنشر أي شيء بعد.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'attendees' && (
                    <div className="space-y-6">
                        <h2 className="font-bold text-lg mb-4 text-stone-800">المسجلون في الدروس</h2>
                        {myLessons.map(lesson => {
                            const registeredUsers = allUsers.filter(u => u.registeredLessons.includes(lesson.id));
                            return (
                                <div key={lesson.id} className="border border-stone-200 rounded-xl overflow-hidden mb-4">
                                    <div className="bg-stone-50 p-4 border-b border-stone-200 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-emerald-900">{lesson.title}</h3>
                                            <p className="text-xs text-stone-500">{new Date(lesson.date).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                                            {registeredUsers.length} مسجل
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        {registeredUsers.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {registeredUsers.map(u => (
                                                    <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden">
                                                            <img src={u.image || '/user.png'} alt={u.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{u.name}</p>
                                                            <p className="text-xs text-stone-500" dir="ltr">{u.phone}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-stone-400 text-sm text-center">لا يوجد مسجلين حتى الآن</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'add_lesson' && <AddLessonForm onSuccess={() => setActiveTab('dashboard')} />}
                {activeTab === 'add_post' && <AddPostForm onSuccess={() => setActiveTab('dashboard')} />}
                {activeTab === 'challenges' && <ChallengesManager mosqueId={myMosque.id} />}
                {activeTab === 'settings' && <EditProfileForm mosque={myMosque} onUpdate={(data) => updateMosque(myMosque.id, data)} />}
                {activeTab === 'qrcode' && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">QR Code الخاص بالمسجد</h2>
                            <p className="text-stone-500 max-w-md mx-auto">يمكن للمصلين مسح هذا الرمز للوصول إلى صفحة المسجد ومواعيد الدروس مباشرة.</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 shadow-lg">
                            {/* Generates a QR Code for the Mosque ID using a public API */}
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${myMosque.id}&color=065f46`}
                                alt="Mosque QR Code"
                                className="w-64 h-64"
                            />
                        </div>
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-stone-100 text-stone-700 px-6 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors">
                            <Upload size={20} />
                            طباعة أو تحميل الرمز
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddLessonForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const { addLesson, currentUser } = useApp();
    const [title, setTitle] = useState('');
    const [sheikhName, setSheikhName] = useState(currentUser?.name || '');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState('lecture');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLesson({
            title,
            sheikhName,
            date: new Date(date).toISOString(),
            time,
            type: type as any,
            description
        });
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-center mb-6 text-emerald-900">إضافة درس جديد</h2>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">عنوان الدرس</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl" placeholder="مثال: تفسير آيات الصيام" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">اسم الشيخ / المحاضر</label>
                    <input type="text" required value={sheikhName} onChange={e => setSheikhName(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">نوع النشاط</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl">
                        <option value="lecture">محاضرة</option>
                        <option value="course">دورة علمية</option>
                        <option value="competition">مسابقة</option>
                        <option value="activity">نشاط عام</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">التاريخ</label>
                    <div className="relative">
                        <Calendar className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full pr-10 pl-3 py-3 bg-stone-50 border rounded-xl" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">الوقت</label>
                    <div className="relative">
                        <Clock className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                        <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full pr-10 pl-3 py-3 bg-stone-50 border rounded-xl" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">تفاصيل الدرس</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 bg-stone-50 border rounded-xl" placeholder="نبذة مختصرة عن محتوى الدرس..."></textarea>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                نشر الدرس
            </button>
        </form>
    );
};

const AddPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const { addPost } = useApp();
    const [content, setContent] = useState('');
    const [type, setType] = useState('general');
    const [visibility, setVisibility] = useState<'public' | 'followers'>('public');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addPost({
            content,
            type: type as any,
            comments: [],
            visibility
        });
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-center mb-6 text-emerald-900">نشر إعلان جديد</h2>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">نوع المنشور</label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setType('general')} className={`flex-1 py-2 rounded-lg border ${type === 'general' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'border-stone-200'}`}>عام</button>
                    <button type="button" onClick={() => setType('announcement')} className={`flex-1 py-2 rounded-lg border ${type === 'announcement' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'border-stone-200'}`}>تنبيه هام</button>
                    <button type="button" onClick={() => setType('lesson_alert')} className={`flex-1 py-2 rounded-lg border ${type === 'lesson_alert' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-stone-200'}`}>تذكير بدرس</button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">الظهور</label>
                <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${visibility === 'public' ? 'bg-white shadow-sm text-emerald-700' : 'text-stone-500'
                            }`}
                    >
                        <Globe size={16} />
                        للجميع
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisibility('followers')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${visibility === 'followers' ? 'bg-white shadow-sm text-emerald-700' : 'text-stone-500'
                            }`}
                    >
                        <Lock size={16} />
                        للمتابعين فقط
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">نص المنشور</label>
                <div className="relative">
                    <AlignLeft className="absolute right-3 top-3 text-stone-400 w-5 h-5" />
                    <textarea required value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full pr-10 pl-3 py-3 bg-stone-50 border rounded-xl" placeholder="اكتب ما تود مشاركته مع المصلين..."></textarea>
                </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                نشر الآن
            </button>
        </form>
    );
};

const EditProfileForm = ({ mosque, onUpdate }: { mosque: Mosque; onUpdate: (data: Partial<Mosque>) => void }) => {
    const [name, setName] = useState(mosque.name);
    const [imamName, setImamName] = useState(mosque.imamName);
    const [address, setAddress] = useState(mosque.address);
    const [phone, setPhone] = useState(mosque.phone || '');
    const [lat, setLat] = useState(mosque.location.lat);
    const [lng, setLng] = useState(mosque.location.lng);
    const [image, setImage] = useState(mosque.image);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Amenities
    const possibleAmenities = ['مصلى سيدات', 'تكييف', 'موقف سيارات', 'مكتبة', 'دورة مياه لذوي الهمم', 'مكان للوضوء'];
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(mosque.amenities || []);

    const toggleAmenity = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(prev => prev.filter(a => a !== amenity));
        } else {
            setSelectedAmenities(prev => [...prev, amenity]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGetLocation = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLat(position.coords.latitude);
                setLng(position.coords.longitude);
                setLoadingLocation(false);
            }, (error) => {
                console.error("Error getting location", error);
                setLoadingLocation(false);
                alert("تعذر تحديد الموقع تلقائياً. يرجى التأكد من تفعيل خدمة الموقع.");
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({
            name,
            imamName,
            address,
            phone,
            location: { lat, lng },
            image,
            amenities: selectedAmenities
        });
        alert("تم تحديث بيانات المسجد بنجاح");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-6 text-emerald-900">تعديل بيانات المسجد</h2>

            {/* Image Upload */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-stone-200 relative group">
                    <img src={image} alt="Mosque" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white w-8 h-8" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <p className="text-sm text-stone-500">اضغط على الصورة لتغييرها</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">اسم المسجد</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">اسم الإمام / المسؤول</label>
                    <input type="text" required value={imamName} onChange={e => setImamName(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">رقم الهاتف للتواصل</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-stone-50 border rounded-xl text-right" dir="ltr" placeholder="01xxxxxxxxx" />
            </div>

            {/* Location Section */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                    <MapPin size={18} className="text-emerald-600" />
                    موقع المسجد
                </h3>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">العنوان كتابةً</label>
                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 bg-white border rounded-xl" placeholder="الحي، الشارع، علامة مميزة" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={loadingLocation}
                        className="flex-1 w-full bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                        {loadingLocation ? 'جاري التحديد...' : 'تحديد موقعي الحالي (GPS)'}
                    </button>

                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 w-full bg-white text-emerald-700 border border-emerald-200 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                    >
                        <ExternalLink size={16} />
                        تأكيد الموقع على خرائط جوجل
                    </a>
                </div>
                <div className="text-xs text-stone-400 text-center ltr">
                    Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>
            </div>

            {/* Amenities Section */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">مميزات ومرافق المسجد</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {possibleAmenities.map(amenity => (
                        <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${selectedAmenities.includes(amenity)
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                : 'bg-white border-stone-200 text-stone-500 hover:border-emerald-300'
                                }`}
                        >
                            <span className="text-sm font-bold">{amenity}</span>
                            {selectedAmenities.includes(amenity) && <Check size={16} className="text-emerald-600" />}
                        </button>
                    ))}
                </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                حفظ التغييرات
            </button>
        </form>
    );
};

const ChallengesManager = ({ mosqueId }: { mosqueId: string }) => {
    const [showCreator, setShowCreator] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<any>(null);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallengeAttempts, setSelectedChallengeAttempts] = useState<any>(null);

    const fetchChallenges = async () => {
        try {
            // Use admin=true to see all challenges (including stopped ones)
            const data = await APIService.request<any[]>(`/mosques/${mosqueId}/challenges?admin=true`);

            // For each challenge, fetch its full details (including questions) for editing
            const fullChallenges = await Promise.all((data || []).map(async (c) => {
                try {
                    const full = await APIService.request<any>(`/challenges/${c.id}`);
                    return { ...c, ...full };
                } catch {
                    return c;
                }
            }));

            setChallenges(fullChallenges);
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChallenge = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا التحدي نهائياً؟ سيتم حذف جميع نتائج المشاركين أيضاً.')) return;
        try {
            await APIService.request(`/mosques/challenges/${id}`, { method: 'DELETE' });
            fetchChallenges();
        } catch (error) {
            alert('حدث خطأ أثناء حذف التحدي');
        }
    };

    const handleToggleStatus = async (challenge: any) => {
        try {
            await APIService.request(`/mosques/challenges/${challenge.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...challenge,
                    isActive: !challenge.is_active
                })
            });
            fetchChallenges();
        } catch (error) {
            alert('حدث خطأ أثناء تحديث حالة التحدي');
        }
    };

    const fetchChallengeAttempts = async (challengeId: string) => {
        try {
            const data = await APIService.request<any[]>(`/challenges/${challengeId}/attempts`);
            setSelectedChallengeAttempts({
                challengeId,
                attempts: data || []
            });
        } catch (error) {
            console.error('Error fetching challenge attempts:', error);
            alert('حدث خطأ أثناء جلب محاولات المستخدمين');
        }
    };

    React.useEffect(() => {
        fetchChallenges();
    }, [mosqueId]);

    if (showCreator || editingChallenge) {
        return (
            <ChallengeCreator
                mosqueId={mosqueId}
                initialData={editingChallenge}
                onClose={() => { setShowCreator(false); setEditingChallenge(null); }}
                onSuccess={() => { setShowCreator(false); setEditingChallenge(null); fetchChallenges(); }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg text-stone-800">التحديات والمسابقات</h2>
                <button
                    onClick={() => setShowCreator(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                    <PlusCircle size={18} />
                    إنشاء تحدي جديد
                </button>
            </div>

            {/* Modal for showing challenge attempts */}
            {selectedChallengeAttempts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                            <div>
                                <h3 className="text-xl font-bold">المشاركون في التحدي</h3>
                                <p className="text-emerald-100 text-sm">عدد المشاركين: {selectedChallengeAttempts.attempts.length}</p>
                            </div>
                            <button
                                onClick={() => setSelectedChallengeAttempts(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedChallengeAttempts.attempts.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedChallengeAttempts.attempts.map((attempt: any, index: number) => (
                                        <div key={attempt.id} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-stone-400' : index === 2 ? 'bg-amber-700' : 'bg-stone-300'}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-800">{attempt.user_name}</h4>
                                                    <p className="text-xs text-stone-500" dir="ltr">{attempt.user_phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-emerald-700">{attempt.score}/{attempt.total_questions}</div>
                                                <div className="text-xs text-stone-500">النتيجة</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Users className="mx-auto text-stone-300 mb-2" size={48} />
                                    <p className="text-stone-500 font-medium">لم يشارك أي مستخدم في هذا التحدي بعد</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-stone-100 bg-stone-50">
                            <button
                                onClick={() => setSelectedChallengeAttempts(null)}
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : challenges.length > 0 ? (
                <div className="space-y-4">
                    {challenges.map((challenge: any) => {
                        const isEnded = new Date(challenge.end_date) < new Date();
                        const isStarted = new Date(challenge.start_date) <= new Date();
                        const statusLabel = challenge.is_active === 0 ? 'متوقف' : isEnded ? 'منتهي' : !isStarted ? 'مجدول' : 'نشط';
                        const statusColor = challenge.is_active === 0 ? 'bg-red-100 text-red-700' : isEnded ? 'bg-stone-200 text-stone-600' : !isStarted ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';

                        return (
                            <div key={challenge.id} className="bg-stone-50 rounded-3xl p-6 border border-stone-100 hover:border-emerald-200 transition-all flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg text-emerald-900">{challenge.title}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <p className="text-sm text-stone-500 line-clamp-2 mb-3">{challenge.description}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                ينتهي: {new Date(challenge.end_date).toLocaleDateString('ar-EG')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <HelpCircle size={12} />
                                                {challenge.questions?.length || 0} سؤال
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                                    <button
                                        onClick={() => fetchChallengeAttempts(challenge.id)}
                                        className="flex-1 bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-50 flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Users size={14} />
                                        المشاركون
                                    </button>

                                    <button
                                        onClick={() => setEditingChallenge(challenge)}
                                        className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        تعديل
                                    </button>

                                    <button
                                        onClick={() => handleToggleStatus(challenge)}
                                        className={`${challenge.is_active === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} px-3 py-2 rounded-xl text-xs font-bold hover:opacity-80 flex items-center justify-center gap-1.5 transition-colors`}
                                    >
                                        {challenge.is_active === 0 ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                        {challenge.is_active === 0 ? 'تشغيل' : 'إيقاف'}
                                    </button>

                                    <button
                                        onClick={() => handleDeleteChallenge(challenge.id)}
                                        className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        حذف
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                    <Trophy className="mx-auto text-stone-300 mb-2" size={32} />
                    <p className="text-stone-500 font-medium">لا توجد تحديات نشطة حالياً</p>
                    <button onClick={() => setShowCreator(true)} className="text-emerald-600 text-sm font-bold mt-2 hover:underline">
                        بدء أول تحدي
                    </button>
                </div>
            )}
        </div>
    );
};