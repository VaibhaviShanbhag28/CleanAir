import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useAQI } from '@/hooks/useAQI';
import { ToastProvider } from '@/components/ui';
import Navbar from '@/components/layout/Navbar';
import ChatBot from '@/components/ai/ChatBot';
import ErrorBoundary from '@/components/ErrorBoundary';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

// Pages
import Dashboard from '@/pages/Dashboard';
import OnboardingPage from '@/pages/OnboardingPage';
import RequireRole from '@/components/RequireRole';
import ReportPage from '@/pages/ReportPage';
import MapPage from '@/pages/MapPage';
import KarmaPage from '@/pages/KarmaPage';
import CommunityPage from '@/pages/CommunityPage';
import DiaryPage from '@/pages/DiaryPage';
import AIToolsPage from '@/pages/AIToolsPage';
import MunicipalPage from '@/pages/MunicipalPage';
import NotFoundPage from '@/pages/NotFoundPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
        {children}
      </main>
      <ChatBot />
      <OnboardingTour />
      <ToastProvider />
    </div>
  );
}

function AppInner() {
  useAuth();
  useAQI();
  const { darkMode } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<RequireRole><Dashboard /></RequireRole>} />
          <Route path="/report" element={<RequireRole><ReportPage /></RequireRole>} />
          <Route path="/map" element={<RequireRole><MapPage /></RequireRole>} />
          <Route path="/karma" element={<RequireRole><KarmaPage /></RequireRole>} />
          <Route path="/community" element={<RequireRole><CommunityPage /></RequireRole>} />
          <Route path="/diary" element={<RequireRole><DiaryPage /></RequireRole>} />
          <Route path="/tools" element={<RequireRole><AIToolsPage /></RequireRole>} />
          <Route path="/municipal" element={
            <RequireRole roles={['authority', 'admin']}><MunicipalPage /></RequireRole>
          } />
          <Route path="/notifications" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
