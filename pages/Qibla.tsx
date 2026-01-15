import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, MapPin, Navigation } from 'lucide-react';

export const Qibla = () => {
    const { getUserLocation, currentUser } = useApp();
    const [heading, setHeading] = useState<number | null>(null);
    const [qiblaDirection, setQiblaDirection] = useState<number>(0);
    const [error, setError] = useState('');

    const MECCA_LAT = 21.422487;
    const MECCA_LNG = 39.826206;

    useEffect(() => {
        if (!currentUser?.location) {
            getUserLocation();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.location) {
            calculateQibla(currentUser.location.lat, currentUser.location.lng);
        }
    }, [currentUser]);

    const calculateQibla = (lat: number, lng: number) => {
        const phiK = MECCA_LAT * Math.PI / 180.0;
        const lambdaK = MECCA_LNG * Math.PI / 180.0;
        const phi = lat * Math.PI / 180.0;
        const lambda = lng * Math.PI / 180.0;
        
        const psi = 180.0 / Math.PI * Math.atan2(
            Math.sin(lambdaK - lambda),
            Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
        );
        
        setQiblaDirection(Math.round(psi));
    };

    // Note: Actual compass access in web browsers is often restricted or requires secure context/permission
    // We will simulate compass or show the bearing.
    
    return (
        <div className="max-w-md mx-auto space-y-6 text-center">
            <h1 className="text-2xl font-bold text-emerald-900">اتجاه القبلة</h1>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
                {!currentUser?.location ? (
                    <div className="py-10">
                        <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-500">جاري تحديد الموقع...</p>
                    </div>
                ) : (
                    <>
                         <div className="relative w-64 h-64 mx-auto mb-8 bg-stone-50 rounded-full border-4 border-emerald-100 flex items-center justify-center shadow-inner">
                            {/* Compass Rose */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-stone-300 text-xs font-bold absolute top-2">N</div>
                                <div className="text-stone-300 text-xs font-bold absolute bottom-2">S</div>
                                <div className="text-stone-300 text-xs font-bold absolute right-2">E</div>
                                <div className="text-stone-300 text-xs font-bold absolute left-2">W</div>
                            </div>
                            
                            {/* Qibla Indicator Arrow */}
                            <div 
                                className="absolute w-full h-full transition-transform duration-1000 ease-out"
                                style={{ transform: `rotate(${qiblaDirection}deg)` }}
                            >
                                <div className="w-1 h-1/2 bg-gradient-to-t from-transparent to-emerald-500 mx-auto origin-bottom relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">🕋</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <h2 className="text-lg font-bold text-emerald-800 mb-1">
                                {qiblaDirection > 0 ? `${qiblaDirection}° شرق الشمال` : `${Math.abs(qiblaDirection)}° غرب الشمال`}
                            </h2>
                            <p className="text-xs text-emerald-600">
                                زاوية القبلة بالنسبة للشمال الجغرافي من موقعك
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="text-xs text-stone-400 max-w-xs mx-auto">
                ملاحظة: هذا الاتجاه محسوب بناءً على إحداثيات GPS. للحصول على أدق نتيجة، استخدم بوصلة حقيقية ووجهها نحو الدرجة الموضحة.
            </div>
        </div>
    );
};