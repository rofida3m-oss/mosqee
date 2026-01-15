import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Calendar, HelpCircle, Trophy, FileJson, Edit3, Sparkles, Copy, AlertCircle, Check } from 'lucide-react';
import APIService from '../services/apiService';

interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface ChallengeCreatorProps {
    mosqueId: string;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // To support editing
}

const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({ mosqueId, onClose, onSuccess, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [startDate, setStartDate] = useState(initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '');
    const [endDate, setEndDate] = useState(initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '');
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [visibility, setVisibility] = useState<'public' | 'followers'>(initialData?.visibility || 'public');
    const [startNow, setStartNow] = useState(false);

    // JSON Mode State
    const [mode, setMode] = useState<'manual' | 'json'>('manual');
    const [jsonText, setJsonText] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const addQuestion = () => {
        setQuestions([...questions, {
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            questionText: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            explanation: ''
        }]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    // Sync from questions array to JSON text
    useEffect(() => {
        if (mode === 'manual') {
            const strippedQuestions = questions.map(({ id, ...rest }) => rest);
            setJsonText(JSON.stringify(strippedQuestions, null, 2));
        }
    }, [questions, mode]);

    const handleApplyJson = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) throw new Error('يجب أن يكون الملف عبارة عن مصفوفة (Array) من الأسئلة');

            const validatedQuestions: Question[] = parsed.map((q: any, index: number) => {
                if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
                    throw new Error(`السؤال رقم ${index + 1} غير صالح. تأكد من وجود نص السؤال وقائمتين من الخيارات على الأقل.`);
                }
                return {
                    id: q.id || 'q_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 9),
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                    explanation: q.explanation || ''
                };
            });

            setQuestions(validatedQuestions);
            setJsonError(null);
            setMode('manual');
        } catch (error: any) {
            setJsonError(error.message);
        }
    };

    const handleCopyAIPrompt = () => {
        const prompt = `أريدك أن تعمل كمعد أسئلة لمسابقة إسلامية. يرجى إنشاء 10 أسئلة متنوعة (فقه، سيرة، تفكير إسلامي) وإرجاعها حصرياً بصيغة JSON كالتالي:
[
  {
    "questionText": "نص السؤال هنا",
    "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
    "correctAnswer": 0, (حدد الرقم من 0 إلى 3 حسب الخيار الصحيح)
    "explanation": "تقديم شرح موجز للإجابة الصحيحة"
  }
]
تأكد من أن البيانات دقيقة وصحيحة لغوياً وعقائدياً.`;

        navigator.clipboard.writeText(prompt);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSubmit = async () => {
        if (!title || !endDate || questions.length === 0) {
            alert('الرجاء ملء الحقول الأساسية وإضافة سؤال واحد على الأقل');
            return;
        }

        // Logic for Start Now: if checked, use current time
        const finalStartDate = startNow ? new Date().toISOString() : (startDate || new Date().toISOString());

        try {
            const payload = {
                mosqueId,
                title,
                description,
                startDate: finalStartDate,
                endDate,
                visibility,
                questions,
                isActive: initialData ? initialData.is_active : 1
            };

            if (initialData) {
                // Edit existing
                await APIService.request(`/mosques/challenges/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                // Create new
                await APIService.request('/mosques/challenges', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...payload,
                        id: 'chal_' + Date.now()
                    })
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving challenge:', error);
            alert('حدث خطأ أثناء حفظ التحدي');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {initialData ? 'تعديل التحدي' : 'إنشاء تحدي جديد برؤية ذكية'}
                            </h2>
                            <p className="text-emerald-100 text-sm">
                                {initialData ? 'قم بتحديث بيانات ومسار التحدي' : 'استخدم الذكاء الاصطناعي أو أضف أسئلتك يدوياً'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-stone-50">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-6">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <Calendar className="text-emerald-600" size={20} />
                                معلومات التحدي
                            </h3>
                            <button
                                onClick={() => setShowAIAssistant(!showAIAssistant)}
                                className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 animate-pulse"
                            >
                                <Sparkles size={16} />
                                مساعد AI للأسئلة
                            </button>
                        </div>

                        {showAIAssistant && (
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg space-y-4 animate-slideDown">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-emerald-300" />
                                    <h4 className="font-bold">كيف تنشئ أسئلة بضغطة واحدة؟</h4>
                                </div>
                                <p className="text-emerald-50 text-sm leading-relaxed">
                                    يمكنك استخدام ChatGPT أو أي ذكاء اصطناعي لتوليد أسئلة جاهزة. انسخ التعليمات (Prompt) وألصقها في محادثة الذكاء الاصطناعي، ثم انسخ النتيجة وألصقها هنا في وضع JSON.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyAIPrompt}
                                        className="flex-1 bg-white text-emerald-700 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all"
                                    >
                                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                                        {copySuccess ? 'تم نسخ التعليمات' : 'نسخ تعليمات AI'}
                                    </button>
                                    <button
                                        onClick={() => { setMode('json'); setShowAIAssistant(false); }}
                                        className="flex-1 bg-emerald-500/30 text-white py-2 rounded-xl font-bold border border-white/20 hover:bg-emerald-500/50 transition-all"
                                    >
                                        فتح وضع الاستيراد (JSON)
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">عنوان التحدي</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    placeholder="مثال: مسابقة السيرة النبوية"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">الوصف</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none h-24 resize-none"
                                    placeholder="اكتب وصفاً مختصراً للتحدي..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-stone-600">تاريخ البدء</label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={startNow}
                                                onChange={e => setStartNow(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            بدء التحدي من الآن
                                        </label>
                                    </div>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        disabled={startNow}
                                        className={`w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none transition-opacity ${startNow ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">تاريخ الانتهاء</label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-stone-200/50 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'manual' ? 'bg-white text-emerald-700 shadow-md' : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            <Edit3 size={18} />
                            إدخال يدوي
                        </button>
                        <button
                            onClick={() => setMode('json')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'json' ? 'bg-white text-emerald-700 shadow-md' : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            <FileJson size={18} />
                            استيراد JSON (AI)
                        </button>
                    </div>

                    {/* Questions Area */}
                    {mode === 'manual' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                    <HelpCircle className="text-emerald-600" size={20} />
                                    الأسئلة ({questions.length})
                                </h3>
                                <button
                                    onClick={addQuestion}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md"
                                >
                                    <Plus size={18} />
                                    إضافة سؤال
                                </button>
                            </div>

                            {questions.length === 0 && (
                                <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center space-y-3">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300">
                                        <HelpCircle size={32} />
                                    </div>
                                    <h4 className="font-bold text-stone-600">لا توجد أسئلة بعد</h4>
                                    <p className="text-stone-400 text-sm">ابدأ بإضافة أسئلة يدوياً أو استخدم وضع الاستيراد</p>
                                </div>
                            )}

                            {questions.map((q, qIndex) => (
                                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative group transition-all hover:border-emerald-200">
                                    <button
                                        onClick={() => removeQuestion(qIndex)}
                                        className="absolute top-4 left-4 text-stone-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">
                                                {qIndex + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={q.questionText}
                                                onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                                                className="flex-1 p-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none font-bold placeholder-stone-300"
                                                placeholder="اكتب السؤال هنا..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mr-11">
                                            {q.options.map((option, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${q.id}`}
                                                        checked={q.correctAnswer === oIndex}
                                                        onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                        className={`flex-1 p-2 rounded-lg border focus:border-emerald-500 outline-none text-sm ${q.correctAnswer === oIndex ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'
                                                            }`}
                                                        placeholder={`الخيار ${oIndex + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mr-11">
                                            <textarea
                                                value={q.explanation}
                                                onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                className="w-full p-3 rounded-xl border border-stone-200 focus:border-emerald-500 outline-none text-sm h-20 resize-none bg-stone-50 placeholder-stone-400"
                                                placeholder="شرح الإجابة (يظهر بعد الحل)..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                    <FileJson className="text-emerald-600" size={20} />
                                    محرر JSON
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setJsonText('')}
                                        className="text-stone-400 hover:text-red-500 text-sm font-bold transition-colors"
                                    >
                                        مسح الكل
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={jsonText}
                                    onChange={e => setJsonText(e.target.value)}
                                    className={`w-full h-96 p-6 rounded-3xl border-2 font-mono text-sm outline-none transition-all ${jsonError ? 'border-red-200 bg-red-50/30' : 'border-stone-200 bg-white focus:border-emerald-500'
                                        }`}
                                    placeholder="ألصق كود JSON هنا..."
                                />
                                {jsonError && (
                                    <div className="absolute bottom-4 right-4 left-4 bg-red-500 text-white p-3 rounded-xl text-sm flex items-center gap-2 animate-bounce">
                                        <AlertCircle size={18} />
                                        {jsonError}
                                    </div>
                                )}
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <p className="text-amber-800 text-xs leading-relaxed">
                                    💡 <strong>تنبيه:</strong> سيتم استبدال جميع الأسئلة الحالية بالأسئلة الموجودة في كود JSON عند الضغط على زر التطبيق.
                                </p>
                            </div>

                            <button
                                onClick={handleApplyJson}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={20} />
                                معالجة وتطبيق الأسئلة
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-100 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Save size={20} />
                        {initialData ? 'حفظ التغييرات' : 'نشر التحدي'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeCreator;
