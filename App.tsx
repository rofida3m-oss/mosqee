import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';

// Lazy load pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));
const MosqueProfile = lazy(() => import('./pages/MosqueProfile').then(m => ({ default: m.MosqueProfile })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const ManageMosque = lazy(() => import('./pages/ManageMosque').then(m => ({ default: m.ManageMosque })));
const SmartAssistant = lazy(() => import('./pages/SmartAssistant').then(m => ({ default: m.SmartAssistant })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const AdminSupport = lazy(() => import('./pages/AdminSupport').then(m => ({ default: m.AdminSupport })));
const ContactSupport = lazy(() => import('./pages/ContactSupport').then(m => ({ default: m.ContactSupport })));
const Tasbih = lazy(() => import('./pages/Tasbih').then(m => ({ default: m.Tasbih })));
const Athkar = lazy(() => import('./pages/Athkar').then(m => ({ default: m.Athkar })));
const Services = lazy(() => import('./pages/Services').then(m => ({ default: m.Services })));
const Qibla = lazy(() => import('./pages/Qibla').then(m => ({ default: m.Qibla })));
const Zakat = lazy(() => import('./pages/Zakat').then(m => ({ default: m.Zakat })));
const Khatma = lazy(() => import('./pages/Khatma').then(m => ({ default: m.Khatma })));
const QuranReader = lazy(() => import('./pages/QuranReader').then(m => ({ default: m.QuranReader })));
const Radio = lazy(() => import('./pages/Radio').then(m => ({ default: m.Radio })));
const AsmaulHusna = lazy(() => import('./pages/AsmaulHusna').then(m => ({ default: m.AsmaulHusna })));
const Challenges = lazy(() => import('./pages/Challenges').then(m => ({ default: m.Challenges })));
const SavedPosts = lazy(() => import('./pages/SavedPosts').then(m => ({ default: m.SavedPosts })));
const Lessons = lazy(() => import('./pages/Lessons').then(m => ({ default: m.Lessons })));
const LessonView = lazy(() => import('./pages/LessonView').then(m => ({ default: m.LessonView })));
const LessonQuiz = lazy(() => import('./pages/LessonQuiz').then(m => ({ default: m.LessonQuiz })));


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, authChecked } = useApp();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useApp();
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />

        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/mosque/:id" element={<ProtectedRoute><MosqueProfile /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/manage-mosque" element={<ProtectedRoute><ManageMosque /></ProtectedRoute>} />
        <Route path="/smart-assistant" element={<ProtectedRoute><SmartAssistant /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />

        {/* Features */}
        <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/tasbih" element={<ProtectedRoute><Tasbih /></ProtectedRoute>} />
        <Route path="/athkar" element={<ProtectedRoute><Athkar /></ProtectedRoute>} />
        <Route path="/qibla" element={<ProtectedRoute><Qibla /></ProtectedRoute>} />
        <Route path="/zakat" element={<ProtectedRoute><Zakat /></ProtectedRoute>} />
        <Route path="/khatma" element={<ProtectedRoute><Khatma /></ProtectedRoute>} />
        <Route path="/quran" element={<ProtectedRoute><QuranReader /></ProtectedRoute>} />
        <Route path="/radio" element={<ProtectedRoute><Radio /></ProtectedRoute>} />
        <Route path="/asmaul-husna" element={<ProtectedRoute><AsmaulHusna /></ProtectedRoute>} />
        <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
        <Route path="/saved-posts" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
        <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
        <Route path="/lessons/:lessonId" element={<ProtectedRoute><LessonView /></ProtectedRoute>} />
        <Route path="/lessons/:lessonId/quiz" element={<ProtectedRoute><LessonQuiz /></ProtectedRoute>} />


        <Route path="/admin" element={<ProtectedRoute><AdminSupport /></ProtectedRoute>} />
        <Route path="/contact-support" element={<ProtectedRoute><ContactSupport /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}