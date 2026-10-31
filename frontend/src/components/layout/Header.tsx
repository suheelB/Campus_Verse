import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Menu, X, LogOut, BookOpen } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BookOpen },
  ]

  const authLinks = user ? (
    <>
      <Link to="/dashboard" className="btn-primary">
        Dashboard
      </Link>
      <button onClick={logout} className="btn-ghost">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="btn-ghost">
        Log in
      </Link>
      <Link to="/register" className="btn-primary">
        Sign up
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4" aria-label="Global">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600" aria-label="CampusVerse Home">
            <BookOpen className="h-7 w-7" />
            <span>CampusVerse</span>
          </Link>

          <div className="hidden md:flex md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname === link.href ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {authLinks}

          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-200 px-4 py-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium ${
                  location.pathname === link.href ? 'text-primary-600' : 'text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline" onClick={() => setMobileMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
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