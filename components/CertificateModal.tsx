import React from 'react';
import { Share2, Download, X, Award } from 'lucide-react';

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    category: 'hadith' | 'quran';
    date: string;
}

const CertificateModal: React.FC<CertificateModalProps> = ({
    isOpen,
    onClose,
    userName,
    category,
    date
}) => {
    if (!isOpen) return null;

    const title = category === 'hadith' ? 'الأربعين النووية' : 'قصار السور';
    const description = category === 'hadith'
        ? 'لإتمامه دراسة وشرح الأحاديث المختارة من الأربعين النووية'
        : 'لإتمامه دراسة وتفسير سور مختارة من قصار السور';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
            {/* Confetti Effect (CSS only for simplicity) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                <div className="absolute top-10 right-1/3 w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>

            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 bg-white/50 rounded-full hover:bg-white/80 transition-colors print:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Certificate Content */}
                <div className="p-8 md:p-12 text-center border-[16px] border-double border-[#1B4242] m-2 h-full flex flex-col items-center justify-center bg-[#FDFBF7]">

                    {/* Header Icon */}
                    <div className="mb-6 text-[#D4AF37]">
                        <Award className="w-20 h-20 mx-auto" strokeWidth={1.5} />
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1B4242] mb-2 font-noto-naskh">شهادة إتمام</h1>
                    <div className="w-32 h-1 bg-[#D4AF37] mx-auto mb-8"></div>

                    {/* Body */}
                    <p className="text-xl text-gray-600 mb-4 font-noto-naskh">تشهد منصة Mosqee بأن</p>

                    <h2 className="text-3xl md:text-5xl font-bold text-[#2C6E49] mb-6 font-noto-naskh decoration-wavy underline decoration-[#D4AF37]/30">
                        {userName}
                    </h2>

                    <p className="text-xl text-gray-600 mb-2 font-noto-naskh">قد أتم بنجاح برنامج</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-[#1B4242] mb-6 font-noto-naskh">
                        {title}
                    </h3>

                    <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto font-noto-naskh leading-relaxed">
                        {description}، سائيلن الله أن ينفعه بما تعلم وأن يزيده علماً وعملاً.
                    </p>

                    {/* Footer */}
                    <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-2xl mt-8 pt-8 border-t border-gray-200">
                        <div className="text-center mb-6 md:mb-0">
                            <p className="text-gray-500 text-sm mb-1">التاريخ</p>
                            <p className="font-semibold text-[#1B4242]">{new Date(date).toLocaleDateString('ar-EG')}</p>
                        </div>

                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-2 relative flex items-center justify-center">
                                {/* Seal Effect */}
                                <div className="absolute inset-0 border-4 border-[#D4AF37] rounded-full opacity-30"></div>
                                <div className="absolute inset-2 border-2 border-[#1B4242] rounded-full opacity-50 border-dashed"></div>
                                <span className="font-bold text-[#1B4242] text-sm transform -rotate-12">Mosqee<br />Certified</span>
                            </div>
                        </div>

                        <div className="text-center mt-6 md:mt-0">
                            <p className="text-gray-500 text-sm mb-1">التوقيع</p>
                            <p className="font-family-script text-2xl text-[#1B4242] font-dancing-script">Mosqee Platform</p>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="bg-gray-50 p-4 flex justify-center gap-4 print:hidden border-t border-gray-100">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-[#1B4242] text-white rounded-lg hover:bg-[#2C6E49] transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>تحميل / طباعة</span>
                    </button>
                    {/* Placeholder for future share functionality */}
                    <button className="flex items-center gap-2 px-6 py-2 bg-white text-[#1B4242] border border-[#1B4242] rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-not-allowed opacity-70" title="قريباً">
                        <Share2 className="w-4 h-4" />
                        <span>مشاركة</span>
                    </button>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
                
                .font-noto-naskh {
                    font-family: 'Noto Naskh Arabic', serif;
                }
                .font-dancing-script {
                    font-family: 'Dancing Script', cursive;
                }
            `}</style>
        </div>
    );
};

export default CertificateModal;
