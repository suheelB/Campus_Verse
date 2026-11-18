import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Menu, X, LogOut, Bell, Calendar, Users, Megaphone, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/services/notificationsApi'

export function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsApi.unreadCount,
    enabled: !!user,
    refetchInterval: 30000,
  })
  const unreadCount = unreadQuery.data?.count || 0

  const publicLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/clubs', label: 'Clubs' },
    { href: '/events', label: 'Events' },
  ]

  const privateLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clubs', label: 'Discover Clubs', icon: Users },
    { href: '/my-clubs', label: 'My Clubs', icon: Users },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/clubs/manage', label: 'Manage Clubs', icon: Users },
  ]

  const navLinks = user ? privateLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20" aria-label="Global">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="CampusVerse Home">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900 hidden sm:block">CampusVerse</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === link.href ? 'text-primary-600' : 'text-gray-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative inline-flex items-center justify-center rounded-full p-2.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" className="btn-secondary text-sm">
                Dashboard
              </Link>
              <button onClick={logout} className="btn-ghost text-sm">
                <LogOut className="mr-1.5 h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign up
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-100 px-4 py-6 bg-white">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium rounded-xl px-4 py-2.5 transition-colors ${
                  location.pathname === link.href
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
              {user ? (
                <>
                  <Link to="/notifications" className="btn-outline w-full flex items-center justify-between" onClick={() => setMobileMenuOpen(false)}>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-accent-500 px-2 py-0.5 text-xs text-white font-bold">{unreadCount}</span>
                    )}
                  </Link>
                  <Link to="/dashboard" className="btn-secondary w-full" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-ghost w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline w-full" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary w-full" onClick={() => setMobileMenuOpen(false)}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
