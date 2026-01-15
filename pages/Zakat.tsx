import React, { useState } from 'react';
import { Calculator, Coins, RefreshCw, Info } from 'lucide-react';

export const Zakat = () => {
    const [cash, setCash] = useState<string>('');
    const [goldWeight, setGoldWeight] = useState<string>('');
    const [goldPrice, setGoldPrice] = useState<string>('3000'); // Default Gold Price
    const [silverPrice, setSilverPrice] = useState<string>('40'); // Default Silver Price
    const [calcMethod, setCalcMethod] = useState<'gold' | 'silver'>('gold');
    const [result, setResult] = useState<number | null>(null);

    const NISAB_GOLD_GRAMS = 85;
    const NISAB_SILVER_GRAMS = 595;

    const calculate = () => {
        const totalCash = parseFloat(cash) || 0;
        const totalGoldValue = (parseFloat(goldWeight) || 0) * (parseFloat(goldPrice) || 0);
        
        const totalWealth = totalCash + totalGoldValue;
        
        const nisabValue = calcMethod === 'gold' 
            ? NISAB_GOLD_GRAMS * (parseFloat(goldPrice) || 0)
            : NISAB_SILVER_GRAMS * (parseFloat(silverPrice) || 0);

        if (totalWealth >= nisabValue) {
            setResult(totalWealth * 0.025);
        } else {
            setResult(0);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-emerald-900 text-center">حاسبة الزكاة</h1>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-6">
                
                {/* Method Selection */}
                <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setCalcMethod('gold')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${calcMethod === 'gold' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}
                    >
                        نصاب الذهب (85ج)
                    </button>
                    <button 
                        onClick={() => setCalcMethod('silver')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${calcMethod === 'silver' ? 'bg-white text-emerald-700 shadow-sm' : 'text-stone-500'}`}
                    >
                        نصاب الفضة (595ج)
                    </button>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 flex gap-2">
                    <Info className="shrink-0 w-5 h-5" />
                    <p>
                        {calcMethod === 'gold' 
                            ? `قيمة النصاب الحالية: ${(NISAB_GOLD_GRAMS * parseFloat(goldPrice)).toLocaleString()} جنيه (الأحوط للأغنياء).`
                            : `قيمة النصاب الحالية: ${(NISAB_SILVER_GRAMS * parseFloat(silverPrice)).toLocaleString()} جنيه (أنفع للفقراء).`
                        }
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">السيولة النقدية (ومدخرات البنك)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-stone-50 border rounded-xl" 
                            placeholder="0"
                            value={cash}
                            onChange={(e) => setCash(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">سعر جرام الذهب (21)</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-stone-50 border rounded-xl" 
                                value={goldPrice}
                                onChange={(e) => setGoldPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">سعر جرام الفضة</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-stone-50 border rounded-xl" 
                                value={silverPrice}
                                onChange={(e) => setSilverPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">وزن الذهب المدخر (جرام)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-stone-50 border rounded-xl" 
                            placeholder="0"
                            value={goldWeight}
                            onChange={(e) => setGoldWeight(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={calculate}
                    className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Calculator size={20} />
                    احسب الزكاة
                </button>

                {result !== null && (
                    <div className="mt-6 border-t pt-6 text-center animate-fadeIn">
                        {result > 0 ? (
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                <p className="text-emerald-800 font-bold mb-2">مبلغ الزكاة الواجب إخراجه (2.5%)</p>
                                <p className="text-4xl font-bold text-emerald-600">{result.toLocaleString()} <span className="text-lg">جنيه</span></p>
                            </div>
                        ) : (
                            <div className="text-stone-500 bg-stone-50 p-6 rounded-2xl">
                                <p className="font-bold text-stone-700 mb-1">لا زكاة عليك</p>
                                <p className="text-sm">إجمالي المبلغ لم يبلغ النصاب.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};