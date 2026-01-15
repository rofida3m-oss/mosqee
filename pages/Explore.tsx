import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, MapPin, Navigation, Sparkles, QrCode, Camera, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Mosque, Lesson } from '../types';
import { getSmartLessonRecommendations } from '../services/geminiService';
import jsQR from 'jsqr';

export const Explore = () => {
  const { mosques, searchMosques, lessons } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'mosques' | 'lessons'>('mosques');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  
  // QR Scan State
  const [showQrScan, setShowQrScan] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize displayed mosques to prevent unnecessary recalculations
  const displayedMosques = useMemo(() => 
    searchMosques(searchTerm), 
    [searchTerm, searchMosques]
  );

  // Memoize filtered lessons
  const filteredLessons = useMemo(() => {
    if (activeTab === 'lessons' && searchTerm) {
      return lessons.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.sheikhName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return lessons.slice(0, 10); // Show only first 10 lessons by default
  }, [lessons, searchTerm, activeTab]);

  const handleSmartSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setActiveTab('lessons');
      return;
    }
    
    setIsSearchingAI(true);
    try {
      const results = await getSmartLessonRecommendations(searchTerm, lessons);
      setActiveTab('lessons');
      // We'll use these results - note: you might want to store them in state
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to regular search
      setActiveTab('lessons');
    } finally {
      setIsSearchingAI(false);
    }
  }, [searchTerm, lessons]);

  // Start Camera Logic
  useEffect(() => {
    let isMounted = true;
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!showQrScan || !isMounted) return;
      
      setCameraError('');
      setIsCameraInitializing(true);

      // Security Check
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraError('الكاميرا تتطلب اتصالاً آمناً (HTTPS). يرجى إدخال الرمز يدوياً.');
        setIsCameraInitializing(false);
        return;
      }
      
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('المتصفح لا يدعم تشغيل الكاميرا.');
        setIsCameraInitializing(false);
        return;
      }

      try {
        // Try back camera first
        const constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        currentStream = stream;
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = resolve;
            }
          });
          
          // Start scanning with throttling
          scanFrame();
        }
      } catch (err: any) {
        console.warn("Camera initialization failed:", err);
        if (isMounted) {
          setCameraError(err.name === 'NotAllowedError' 
            ? 'تم رفض الوصول للكاميرا. يرجى منح الصلاحيات في إعدادات المتصفح.'
            : 'تعذر الوصول للكاميرا. قد يكون هناك مشكلة في الإعدادات.'
          );
        }
      } finally {
        if (isMounted) {
          setIsCameraInitializing(false);
        }
      }
    };

    if (showQrScan) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [showQrScan]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Only process every 200ms for performance
        if (scanTimeoutRef.current) return;
        
        scanTimeoutRef.current = setTimeout(() => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code) {
              setSearchTerm(code.data);
              setShowQrScan(false);
              setActiveTab('mosques');
              if (navigator.vibrate) navigator.vibrate(100);
            }
          } catch (e) {
            // Ignore parse errors
          }
          
          scanTimeoutRef.current = null;
        }, 200); // Throttle scanning to 5 FPS max
      }
    }
    
    animationRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const handleManualQRInput = useCallback(() => {
    const trimmedInput = qrInput.trim();
    if (trimmedInput) {
      setSearchTerm(trimmedInput);
      setShowQrScan(false);
      setActiveTab('mosques');
      setQrInput('');
    }
  }, [qrInput]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveTab('mosques');
    }
  }, [searchTerm]);

  // Close QR scanner when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQrScan) {
        setShowQrScan(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showQrScan]);

  // MosqueCard component moved inside to use hooks properly
  const MosqueCard = useCallback(({ mosque }: { mosque: Mosque }) => {
    const { followMosque, currentUser } = useApp();
    const isFollowing = currentUser?.followingMosques.includes(mosque.id);

    return (
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
        <div className="h-32 bg-stone-200 relative overflow-hidden">
          <img 
            src={mosque.image || '/imagemosqee.jfif'} 
            alt={mosque.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/imagemosqee.jfif';
            }}
          />
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-emerald-800">
            <Navigation size={12} />
            <span>0.8 كم</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{mosque.name}</h3>
          <div className="flex items-center gap-1 text-stone-500 text-sm mb-3">
            <MapPin size={14} />
            <span className="line-clamp-1">{mosque.address}</span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-stone-500">
              <span className="font-bold text-stone-900">{mosque.followersCount}</span> متابع
            </div>
            <button 
              onClick={() => followMosque(mosque.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                isFollowing 
                ? 'bg-stone-100 text-stone-600 hover:bg-stone-200' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              aria-label={isFollowing ? 'إلغاء المتابعة' : 'متابعة المسجد'}
            >
              {isFollowing ? 'متابع' : 'متابعة'}
            </button>
          </div>
          <Link 
            to={`/mosque/${mosque.id}`} 
            className="block text-center mt-3 text-emerald-600 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            زيارة الصفحة
          </Link>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="space-y-6 relative">
      {/* Real Camera Modal */}
      {showQrScan && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fadeIn">
          <button 
            onClick={() => setShowQrScan(false)} 
            className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full z-20 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="إغلاق الماسح"
          >
            <X size={24} />
          </button>
          
          <div className="relative w-full h-full md:max-w-md md:h-[600px] bg-black md:rounded-3xl overflow-hidden flex flex-col">
            {cameraError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">تنبيه الكاميرا</h3>
                <p className="text-white/70 mb-6">{cameraError}</p>
                <div className="bg-stone-800 p-4 rounded-xl w-full">
                  <label className="text-sm text-stone-400 block mb-2 text-right">أدخل الرمز يدوياً هنا:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-black border border-stone-600 rounded-lg px-3 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                      value={qrInput}
                      onChange={e => setQrInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualQRInput()}
                      placeholder="مثال: m123456"
                    />
                    <button 
                      onClick={handleManualQRInput}
                      className="bg-emerald-600 px-4 rounded-lg font-bold hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      بحث
                    </button>
                  </div>
                </div>
              </div>
            ) : isCameraInitializing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>جاري تشغيل الكاميرا...</p>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                  </div>
                </div>
                <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-sm px-4">
                  وجّه الكاميرا نحو رمز QR الخاص بالمسجد
                </p>
              </div>
            )}
            
            {!cameraError && !isCameraInitializing && (
              <div className="bg-black/90 p-6">
                <p className="text-stone-400 text-xs text-center mb-2">أو أدخل الرمز يدوياً</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="أدخل الرمز..."
                    className="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualQRInput()}
                  />
                  <button 
                    onClick={handleManualQRInput}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    بحث
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">استكشف الجوامع والدروس</h1>
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3.5 text-stone-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ابحث عن مسجد، شيخ، أو موضوع..." 
              className="w-full pr-10 pl-12 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="بحث عن مسجد أو درس"
            />
            <button 
              type="button"
              onClick={() => setShowQrScan(true)}
              className="absolute left-2 top-2 p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="مسح QR Code"
              aria-label="فتح ماسح QR Code"
            >
              <QrCode size={20} />
            </button>
          </div>
          <button 
            type="button"
            onClick={handleSmartSearch}
            disabled={isSearchingAI}
            className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {isSearchingAI ? (
              <>
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>جاري البحث...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span className="inline">بحث ذكي</span>
              </>
            )}
          </button>
        </form>

        <div className="flex border-b border-stone-100 mb-6">
          <button 
            onClick={() => setActiveTab('mosques')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'mosques' 
                ? 'text-emerald-600' 
                : 'text-stone-400 hover:text-stone-600'
            } focus:outline-none`}
            aria-label="عرض الجوامع"
          >
            الجوامع القريبة
            {activeTab === 'mosques' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('lessons')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'lessons' 
                ? 'text-emerald-600' 
                : 'text-stone-400 hover:text-stone-600'
            } focus:outline-none`}
            aria-label="عرض الدروس"
          >
            نتائج الدروس
            {activeTab === 'lessons' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
        </div>

        {activeTab === 'mosques' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedMosques.map(mosque => (
                <MosqueCard key={mosque.id} mosque={mosque} />
              ))}
            </div>
            {displayedMosques.length === 0 && (
              <div className="col-span-full text-center py-10 text-stone-500">
                <Search size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-lg mb-2">لا توجد مساجد مطابقة للبحث</p>
                <p className="text-sm text-stone-400">حاول البحث باسم المسجد أو المنطقة أو الإمام</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-10 text-stone-500">
                <Search size={48} className="mx-auto mb-4 text-stone-300" />
                <p className="text-lg mb-2">لا توجد دروس مطابقة</p>
                <p className="text-sm text-stone-400">حاول البحث بكلمات مختلفة أو استخدم البحث الذكي</p>
              </div>
            ) : (
              filteredLessons.map(lesson => {
                const mosque = mosques.find(m => m.id === lesson.mosqueId);
                return (
                  <div 
                    key={lesson.id} 
                    className="bg-stone-50 p-4 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-emerald-900 mb-1">{lesson.title}</h3>
                      <p className="text-sm text-stone-500 mb-1">{lesson.sheikhName}</p>
                      {mosque && (
                        <p className="text-xs text-stone-400">{mosque.name}</p>
                      )}
                    </div>
                    <Link 
                      to={`/mosque/${lesson.mosqueId}`} 
                      className="text-emerald-600 text-sm font-bold hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};