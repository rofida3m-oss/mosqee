import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, Radio as RadioIcon, Activity, AlertCircle, Loader2, RefreshCw, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Station {
  id: string;
  name: string;
  url: string;
  backupUrl?: string;
  image: string;
  description?: string;
}

// Multiple backup streams for reliability
const STATIONS: Station[] = [
  {
    id: 'cairo',
    name: 'إذاعة القرآن الكريم - القاهرة',
    url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
    backupUrl: 'https://qurango.net/radio/cairo_radio',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Cairo_Quran_Radio_Logo.svg/1200px-Cairo_Quran_Radio_Logo.svg.png',
    description: 'الإذاعة الرسمية لجمهورية مصر العربية'
  },
  {
    id: 'makkah',
    name: 'إذاعة القرآن الكريم - مكة المكرمة',
    url: 'https://stream.radiojar.com/q4604bbwkguv',
    backupUrl: 'https://qurango.net/radio/makkah_radio',
    image: 'https://cdn-icons-png.flaticon.com/512/2867/2867570.png',
    description: 'من أقدس بقاع الأرض'
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد',
    url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad',
    backupUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_128kbps/',
    image: 'https://i1.sndcdn.com/artworks-000570371660-31s653-t500x500.jpg',
    description: 'أحد أشهر القراء في العالم الإسلامي'
  },
  {
    id: 'menshawy',
    name: 'الشيخ محمد صديق المنشاوي',
    url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi_mojawwad',
    backupUrl: 'https://everyayah.com/data/Minshawi_Murattal_128kbps/',
    image: 'https://yt3.googleusercontent.com/ytc/AIdro_k6yFvKq3q6q0h_uV92vK4l6y8q8q8q8q8q8q8=s900-c-k-c0x00ffffff-no-rj',
    description: 'صاحب الصوت العذب والمقامات الرائعة'
  }
];

// Fallback radio streams in case of network issues
const FALLBACK_STREAMS = [
  'https://icecast1.evr.gr/naftemporikifm',
  'https://stream.radiojar.com/8s5u5tpdtwzuv',
  'https://stream.radiojar.com/q4604bbwkguv'
];

export const Radio = () => {
  const { currentUser } = useApp();
  const [activeStation, setActiveStation] = useState<Station>(STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isBuffering, setIsBuffering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('radio_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('radio_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setError(null);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsBuffering(false);
      setIsPlaying(false);
      setIsLoading(false);
      
      if (retryCount < 2) {
        // Try backup URL
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          handleRetry();
        }, 2000);
      } else {
        setError('تعذر الاتصال بالمحطة. الرجاء المحاولة لاحقاً أو اختيار محطة أخرى.');
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount]);

  // Audio visualization
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const initAudioVisualizer = async () => {
      if (!audioRef.current) return;

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (!analyserRef.current) {
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!analyserRef.current || !isPlaying) return;

          animationRef.current = requestAnimationFrame(draw);
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            // Create gradient effect
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.5, '#059669');
            gradient.addColorStop(1, '#047857');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
          }
        };

        draw();
      } catch (error) {
        console.warn('Audio visualization failed:', error);
      }
    };

    initAudioVisualizer();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Auto-resume audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        setError(null);
        setIsLoading(true);
        
        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        // Reset retry count when starting fresh
        if (!audio.src.includes(activeStation.url)) {
          setRetryCount(0);
          audio.src = activeStation.url;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsLoading(false);
      setError('تعذر تشغيل البث. الرجاء التحقق من اتصال الإنترنت.');
    }
  }, [isPlaying, activeStation.url]);

  const handleRetry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsLoading(true);
    
    // Switch to backup URL if available
    if (retryCount > 0 && activeStation.backupUrl) {
      audio.src = activeStation.backupUrl;
    } else {
      audio.src = activeStation.url;
    }

    audio.load();
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(e => {
          console.error('Retry failed:', e);
          setIsLoading(false);
          setError('فشل إعادة الاتصال. جاري تجربة محطة بديلة...');
          
          // Try a fallback station
          setTimeout(() => {
            const fallbackStation = STATIONS.find(s => s.id !== activeStation.id);
            if (fallbackStation) {
              changeStation(fallbackStation);
            }
          }, 3000);
        });
    }
  }, [activeStation, retryCount]);

  const changeStation = useCallback((station: Station) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsPlaying(false);
    setActiveStation(station);
    setRetryCount(0);
    setIsLoading(true);
    
    // Reset audio source
    audio.src = station.url;
    audio.load();

    // Small delay to ensure src is updated
    setTimeout(() => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(e => {
            console.error('Station change failed:', e);
            setIsLoading(false);
            setIsPlaying(false);
            
            // Try backup URL immediately
            if (station.backupUrl) {
              audio.src = station.backupUrl;
              audio.load();
              audio.play().catch(() => {
                setError('تعذر تشغيل هذه المحطة حالياً.');
              });
            } else {
              setError('تعذر تشغيل هذه المحطة حالياً.');
            }
          });
      }
    }, 100);
  }, []);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavorites(prev => 
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoize stations display with favorites first
  const displayedStations = useMemo(() => {
    return [...STATIONS].sort((a, b) => {
      const aIsFavorite = favorites.includes(a.id);
      const bIsFavorite = favorites.includes(b.id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return 0;
    });
  }, [favorites]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-2 flex items-center justify-center gap-2">
          <RadioIcon className="text-emerald-600 animate-pulse" />
          البث المباشر للقرآن الكريم
        </h1>
        <p className="text-stone-500">استمع إلى كلام الله بقلب خاشع</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center justify-between gap-2 animate-fadeIn border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Player Card */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900/30 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden transition-all duration-500">
        {/* Visualizer Background */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full opacity-20"
          width="800"
          height="600"
        />
        
        {/* Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 backdrop-blur-sm"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Station Image */}
          <div className={`relative w-40 h-40 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden mb-6 transition-all duration-1000 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
            <img 
              src={activeStation.image} 
              alt={activeStation.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
              }}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
            )}
          </div>

          {/* Station Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">{activeStation.name}</h2>
            {activeStation.description && (
              <p className="text-stone-300 text-sm mb-3">{activeStation.description}</p>
            )}
            
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-sm mb-4 h-6">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري التحميل...</span>
                </>
              ) : isBuffering ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري التخزين المؤقت...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Activity size={16} className="animate-pulse text-emerald-400" />
                  <span className="text-emerald-400">جاري البث المباشر</span>
                </>
              ) : (
                <span className="text-stone-400">متوقف</span>
              )}
            </div>

            {/* Time Display (for non-live streams) */}
            {duration > 0 && !isNaN(duration) && (
              <div className="flex items-center justify-between text-sm text-stone-400 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 w-full max-w-md">
            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-2">
              <Volume2 size={20} className="text-stone-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-emerald-500"
              />
            </div>

            {/* Play/Pause Button */}
            <button 
              onClick={togglePlay}
              disabled={isLoading}
              className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                isLoading 
                  ? 'bg-stone-600 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50'
              }`}
              aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(activeStation.id)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
              aria-label={favorites.includes(activeStation.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Heart 
                size={24} 
                className={favorites.includes(activeStation.id) ? 'fill-red-500 text-red-500' : 'text-stone-400'}
              />
            </button>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src={activeStation.url}
          preload="metadata"
          volume={volume}
          onPlay={() => {
            setIsPlaying(true);
            setIsLoading(false);
            setError(null);
          }}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Stations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-emerald-900">المحطات الإذاعية</h3>
          <span className="text-sm text-stone-500">{favorites.length} مفضلة</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedStations.map(station => {
            const isFavorite = favorites.includes(station.id);
            const isActive = activeStation.id === station.id;
            
            return (
              <button
                key={station.id}
                onClick={() => changeStation(station)}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all text-right group ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-white border-stone-100 hover:border-emerald-200 hover:shadow-md'
                }`}
              >
                {/* Station Image */}
                <div className="relative w-12 h-12 rounded-full bg-stone-100 shrink-0 overflow-hidden flex items-center justify-center">
                  <img 
                    src={station.image} 
                    alt={station.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
                    }}
                  />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
                  )}
                </div>
                
                {/* Station Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm truncate ${isActive ? 'text-emerald-900' : 'text-stone-700'}`}>
                      {station.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(station.id);
                      }}
                      className="p-1 hover:bg-stone-100 rounded"
                      aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Heart 
                        size={16} 
                        className={isFavorite ? 'fill-red-500 text-red-500' : 'text-stone-400'}
                      />
                    </button>
                  </div>
                  
                  {station.description && (
                    <p className="text-xs text-stone-500 truncate mt-1">{station.description}</p>
                  )}
                  
                  {isActive && isPlaying && (
                    <p className="text-xs text-emerald-600 font-bold mt-1 animate-pulse">▶️ يعمل الآن...</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
        <h4 className="font-bold text-stone-700 mb-2 flex items-center gap-2">
          <AlertCircle size={18} className="text-emerald-600" />
          نصائح للاستماع
        </h4>
        <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
          <li>يحتاج البث المباشر لاتصال إنترنت مستقر</li>
          <li>يمكنك إضافة المحطات المفضلة بالنقر على ♡</li>
          <li>اضبط مستوى الصوت المناسب لحفظ السمع</li>
          <li>في حال انقطاع البث، جرب محطة أخرى ثم أعد المحاولة</li>
        </ul>
      </div>
    </div>
  );
};