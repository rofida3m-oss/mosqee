import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { dbQueries } from '../services/dbService';
import { Post, Mosque } from '../types';
import { BookHeart, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SavedPosts = () => {
    const { currentUser, mosques } = useApp();
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSavedPosts = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                const results = await dbQueries.getUserFavorites(currentUser.id);
                setSavedPosts(results || []);
            } catch (error) {
                console.error('Failed to fetch saved posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedPosts();
    }, [currentUser]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/services')}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <ArrowRight size={24} className="text-stone-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-emerald-900">المنشورات المحفوظة</h1>
                    <p className="text-sm text-stone-500">منشورات قمت بحفظها للرجوع إليها لاحقاً</p>
                </div>
            </div>

            {savedPosts.length > 0 ? (
                <div className="space-y-6">
                    {savedPosts.map((post) => {
                        const mosque = mosques.find(m => m.id === post.mosqueId);
                        return (
                            <PostCard key={post.id} post={post} mosque={mosque} />
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-12 border border-stone-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mx-auto mb-4">
                        <BookHeart size={32} />
                    </div>
                    <h3 className="font-bold text-stone-800 mb-1">لا توجد منشورات محفوظة</h3>
                    <p className="text-xs text-stone-400 max-w-[200px] mx-auto">عندما تحفظ منشورات، ستظهر هنا للوصول السريع إليها</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                        استكشف الرئيسة
                    </button>
                </div>
            )}
        </div>
    );
};
