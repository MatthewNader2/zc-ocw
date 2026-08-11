import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ParticleBackground from '@/components/ui/ParticleBackground'
import { useEffect } from 'react'

export default function Layout() {
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="relative flex flex-col min-h-screen bg-surface dark:bg-slate-950 text-ink dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      {/* Dynamic Cursor-Active Particle Background */}
      <ParticleBackground isFixed={true} />

      {/* Ambient background glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-25 blur-[120px] pointer-events-none bg-gradient-to-tr from-ocean-500 via-cyan-400 to-purple-600 animate-float" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15 dark:opacity-20 blur-[100px] pointer-events-none bg-gradient-to-br from-indigo-500 via-ocean-600 to-teal-400" />

      <Navbar />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
