import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useStore } from '@/store'
import { Navbar } from '@/components/layout/Navbar'
import HomePage from '@/pages/HomePage'
import MapPage from '@/pages/MapPage'
import ReportPage from '@/pages/ReportPage'
import DashboardPage from '@/pages/DashboardPage'
import MunicipalPage from '@/pages/MunicipalPage'
import { LoginPage, SignupPage } from '@/pages/AuthPages'
import SettingsPage from '@/pages/SettingsPage'
import MyReportsPage from '@/pages/MyReportsPage'
import type { User } from '@/types'

export default function App() {
  const { setUser, theme } = useStore()

  // Apply saved theme on mount
  useEffect(() => {
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }, [theme])

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          setUser({ ...snap.data(), createdAt: new Date(snap.data().createdAt) } as User)
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'citizen',
            createdAt: new Date(),
          })
        }
      } catch {
        // Firestore unavailable
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'citizen',
          createdAt: new Date(),
        })
      }
    })
    return unsub
  }, [setUser])

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/municipal" element={<MunicipalPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            {/* 404 fallback */}
            <Route path="*" element={
              <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
                <div>
                  <p className="text-6xl font-bold text-muted-foreground/30 mb-4">404</p>
                  <h2 className="text-xl font-bold mb-2">Page not found</h2>
                  <Link to="/" className="text-primary hover:underline text-sm">← Go home</Link>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
