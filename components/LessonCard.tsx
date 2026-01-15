import React from 'react';
import { Lesson, Mosque } from '../types';
import { Calendar, Clock, BookOpen, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LessonCardProps {
  lesson: Lesson;
  mosque?: Mosque;
  showMosqueName?: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, mosque, showMosqueName = false }) => {
  const { registerForLesson, currentUser } = useApp();
  const isRegistered = currentUser?.registeredLessons.includes(lesson.id);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('ar-EG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBadgeColor = (type: string) => {
      switch(type) {
          case 'lecture': return 'bg-blue-100 text-blue-700';
          case 'competition': return 'bg-amber-100 text-amber-700';
          case 'course': return 'bg-emerald-100 text-emerald-700';
          default: return 'bg-stone-100 text-stone-700';
      }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
        case 'lecture': return 'محاضرة';
        case 'competition': return 'مسابقة';
        case 'course': return 'دورة علمية';
        default: return 'نشاط';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 mb-3 hover:shadow-md transition-shadow card-container">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-1 rounded-md font-medium ${getBadgeColor(lesson.type)}`}>
            {getTypeLabel(lesson.type)}
        </span>
        {isRegistered && <CheckCircle className="text-emerald-500 w-5 h-5" />}
      </div>

      <h3 className="font-bold text-lg text-emerald-900 mb-1">{lesson.title}</h3>
      {showMosqueName && mosque && <p className="text-sm text-stone-500 mb-2">{mosque.name}</p>}
      
      <p className="text-sm text-stone-600 mb-3">{lesson.description}</p>
      
      <div className="flex flex-wrap gap-3 text-sm text-stone-500 mb-4">
        <div className="flex items-center gap-1">
            <UserIcon className="w-4 h-4" />
            <span>{lesson.sheikhName}</span>
        </div>
        <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(lesson.date)}</span>
        </div>
        <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{lesson.time}</span>
        </div>
      </div>

      <button 
        onClick={() => registerForLesson(lesson.id)}
        disabled={isRegistered}
        className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isRegistered 
            ? 'bg-stone-100 text-stone-400 cursor-default' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isRegistered ? 'تم التسجيل' : 'سجل الآن'}
      </button>
    </div>
  );
};

const UserIcon = ({ className }: {className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
