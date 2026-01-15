import React, { useState, useEffect } from 'react';
import { Post, Mosque, Comment } from '../types';
import {
    Heart, MessageCircle, Share2, MoreHorizontal, Send, Trash2, Edit2, Check, X,
    Image as ImageIcon, Video, Calendar, Clock, MapPin, Search, SlidersHorizontal,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Play,
    Globe,
    Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbQueries } from '../services/dbService';

interface PostCardProps {
    post: Post;
    mosque?: Mosque;
}

export const PostCard: React.FC<PostCardProps> = ({ post, mosque: mosqueProp }) => {
    const { currentUser, mosques, addCommentToPost, likePost, unlikePost, sharePost, deletePostComment, deletePost, editPost } = useApp();

    // Find mosque from context if not provided via props
    const mosque = mosqueProp || mosques.find(m => m.id === post.mosqueId);
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>(post.comments || []);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);

    // Initialize like, favorite and up-to-date counts from DB/server
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                if (!currentUser) return;
                const [liked, favorited, likesCount, serverComments] = await Promise.all([
                    dbQueries.hasUserLiked(post.id, currentUser.id),
                    dbQueries.hasUserFavorited(post.id, currentUser.id),
                    dbQueries.getPostLikesCount(post.id),
                    dbQueries.getPostComments(post.id)
                ]);

                if (!mounted) return;
                setLikes(likesCount || 0);
                setComments(serverComments || post.comments || []);
                setIsLiked(Boolean(liked));
                setIsFavorited(Boolean(favorited));
            } catch (e) {
                console.error('Failed to initialize post state:', e);
            }
        };
        init();
        return () => { mounted = false; };
    }, [post.id, currentUser]);

    // Sync state if props change (e.g. after global refresh)
    useEffect(() => {
        setLikes(post.likes);
        if (post.comments) {
            setComments(post.comments);
        }
    }, [post.likes, post.comments]);

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [showMenu, setShowMenu] = useState(false);

    const timeAgo = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    };

    const handleLike = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (isLiked) {
                await unlikePost(post.id);
            } else {
                await likePost(post.id);
            }
            setIsLiked(!isLiked);
        } catch (e) {
            console.error('Like error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFavorite = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (isFavorited) {
                await dbQueries.removePostFavorite(post.id, currentUser.id);
            } else {
                await dbQueries.addPostFavorite(post.id, currentUser.id);
            }
            setIsFavorited(!isFavorited);
        } catch (e) {
            console.error('Favorite error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setIsLoading(true);
        try {
            const comment: any = {
                id: 'c_' + Date.now(),
                postId: post.id, // CRITICAL: Added postId
                userId: currentUser.id,
                userName: currentUser.name,
                content: newComment,
                parentId: replyTo?.id || null,
                createdAt: new Date().toISOString()
            };

            // Use context function for proper state management
            await addCommentToPost(post.id, comment);

            setNewComment('');
            setReplyTo(null);
        } catch (e: any) {
            console.error('Comment error:', e);
            const errorMsg = e.message || 'حدث خطأ غير متوقع';
            alert(`خطأ: ${errorMsg}\nحاول مرة أخرى.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        setIsLoading(true);
        try {
            await sharePost(post.id);
        } catch (e) {
            console.error('Share error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        setIsLoading(true);
        try {
            await deletePostComment(post.id, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) {
            console.error('Delete comment error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!confirm('هل أنت متأكد من حذف المنشور؟')) return;
        setIsLoading(true);
        try {
            await deletePost(post.id);
        } catch (e) {
            console.error('Delete post error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPost = async () => {
        if (editContent.trim() === post.content) {
            setIsEditing(false);
            return;
        }
        setIsLoading(true);
        try {
            await editPost(post.id, editContent);
            setIsEditing(false);
        } catch (e) {
            console.error('Edit post error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden mb-4 animate-fadeIn card-container">
            {/* Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={mosque?.image || '/imagemosqee.jfif'}
                        alt={mosque?.name || 'مسجد'}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-100"
                    />
                    <div>
                        <h3 className="font-bold text-stone-900 leading-tight">{mosque?.name || 'مسجد غير معروف'}</h3>
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                            <span>{timeAgo(post.createdAt)}</span>
                            {post.visibility === 'followers' && (
                                <>
                                    <span>•</span>
                                    <Lock size={12} />
                                </>
                            )}
                            {post.visibility === 'public' && (
                                <>
                                    <span>•</span>
                                    <Globe size={12} />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-stone-400 hover:text-emerald-600 p-2 -mr-2">
                        <MoreHorizontal size={20} />
                    </button>
                    {showMenu && currentUser?.id === post.userId && (
                        <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
                            <button
                                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                className="w-full text-right px-4 py-2 hover:bg-stone-50 flex items-center gap-2 text-sm"
                            >
                                <Edit2 size={16} /> تعديل
                            </button>
                            <button
                                onClick={() => { handleDeletePost(); setShowMenu(false); }}
                                className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={16} /> حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="px-4 pb-3 space-y-2">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-stone-50 border border-emerald-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                        rows={4}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditPost}
                            disabled={isLoading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                        >
                            حفظ
                        </button>
                        <button
                            onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                            disabled={isLoading}
                            className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg text-sm hover:bg-stone-300 disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-4 pb-3">
                    <p className="text-stone-800 whitespace-pre-line leading-relaxed text-sm md:text-base break-words">{post.content}</p>
                </div>
            )}

            {/* Media */}
            {post.image && !post.videoUrl && (
                <div className="w-full h-64 bg-stone-100">
                    <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                </div>
            )}
            {post.videoUrl && (
                <div className="w-full h-64 bg-black relative flex items-center justify-center group cursor-pointer">
                    {/* Mock Video Player */}
                    <div className="absolute inset-0 opacity-60">
                        <img src={post.image || 'https://picsum.photos/800/400?grayscale'} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                        <Play fill="white" className="text-white ml-1" size={32} />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">03:45</span>
                </div>
            )}

            {/* Interactions Stats */}
            <div className="px-4 py-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-50 mt-2">
                <span>{likes} إعجاب</span>
                <span>{comments.length} تعليق</span>
            </div>

            {/* Action Buttons */}
            <div className="px-2 pb-2 flex items-center justify-between">
                <button
                    onClick={handleLike}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${isLiked ? 'text-red-500 bg-red-50' : 'text-stone-500 hover:bg-stone-50'} disabled:opacity-50`}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-sm font-medium">أعجبني</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                >
                    <MessageCircle size={20} />
                    <span className="text-sm font-medium">تعليق</span>
                </button>
                <button
                    onClick={handleShare}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-emerald-600 transition-colors disabled:opacity-50">
                    <Share2 size={18} />
                    <span className="text-xs font-medium">مشاركة</span>
                </button>
                <button
                    onClick={handleFavorite}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-colors ${isFavorited ? 'text-amber-500 bg-amber-50' : 'text-stone-500 hover:bg-stone-50'} disabled:opacity-50`}
                >
                    <Sparkles size={18} fill={isFavorited ? "currentColor" : "none"} />
                    <span className="text-xs font-medium">حفظ</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-stone-50 p-4 border-t border-stone-100">
                    {replyTo && (
                        <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs mb-3 flex items-center justify-between">
                            <span>الرد على <b>{replyTo.userName}</b></span>
                            <button onClick={() => setReplyTo(null)}><X size={14} /></button>
                        </div>
                    )}

                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                        {comments.length > 0 ? (
                            // Render Top-level comments
                            comments.filter(c => !c.parentId).map(c => (
                                <div key={c.id} className="space-y-3">
                                    <div className={`flex items-start gap-2 ${c.pending ? 'opacity-60' : ''}`}>
                                        <img src={(c as any).userAvatar || '/user.png'} alt={c.userName} className="w-8 h-8 rounded-full object-cover mt-1" />
                                        <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-stone-100">
                                            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                                                <span className="font-bold text-stone-800">{c.userName}</span>
                                                <span>{timeAgo(c.createdAt)}</span>
                                            </div>
                                            <div className="text-sm text-stone-700">{c.content}</div>
                                            <div className="mt-2 flex items-center gap-4">
                                                <button
                                                    onClick={() => setReplyTo(c)}
                                                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                                                >
                                                    رد
                                                </button>
                                            </div>
                                        </div>
                                        {currentUser?.id === c.userId && (
                                            <button onClick={() => handleDeleteComment(c.id)} className="text-stone-300 hover:text-red-600 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Render Replies */}
                                    <div className="mr-10 space-y-3 border-r-2 border-stone-100 pr-4">
                                        {comments.filter(reply => reply.parentId === c.id).map(reply => (
                                            <div key={reply.id} className="flex items-start gap-2">
                                                <img src={(reply as any).userAvatar || '/user.png'} alt={reply.userName} className="w-6 h-6 rounded-full object-cover" />
                                                <div className="bg-white/70 p-2 rounded-xl flex-1 border border-stone-50">
                                                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                                                        <span className="font-bold text-stone-800">{reply.userName}</span>
                                                        <span>{timeAgo(reply.createdAt)}</span>
                                                    </div>
                                                    <div className="text-xs text-stone-700">{reply.content}</div>
                                                </div>
                                                {currentUser?.id === reply.userId && (
                                                    <button onClick={() => handleDeleteComment(reply.id)} className="text-stone-300 hover:text-red-600 p-1">
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-xs text-stone-400 py-4">لا توجد تعليقات بعد</p>
                        )}
                    </div>

                    <form onSubmit={handleComment} className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `الرد على ${replyTo.userName}...` : "اكتب تعليقاً..."}
                            className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                        />
                        <button type="submit" disabled={!newComment.trim() || isLoading} className="bg-emerald-600 text-white p-2 rounded-xl disabled:bg-stone-200 disabled:text-stone-400 shadow-emerald-200 shadow-md">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};