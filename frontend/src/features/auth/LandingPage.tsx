import { Link } from 'react-router-dom';
import { Users, Calendar, Megaphone, Shield } from 'lucide-react';
import { HeroSection } from '@/components/layout/HeroSection';

const features = [
  {
    icon: Users,
    title: 'Discover Clubs',
    description: 'Find and join clubs matching your interests, skills, and schedule.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Calendar,
    title: 'Events & Registration',
    description: 'Browse events, register with one click, and get checked in seamlessly.',
    color: 'bg-accent-100 text-accent-600',
  },
  {
    icon: Megaphone,
    title: 'Smart Announcements',
    description: 'Receive targeted announcements with read receipts and acknowledgements.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'College-scoped data isolation with role-based access control.',
    color: 'bg-accent-100 text-accent-600',
  },
];

export function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <section id="features" className="w-full bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block rounded-full bg-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything your campus needs
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From club discovery to event management, CampusVerse brings
              your entire campus community together in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-primary-200 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-primary-600 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform campus life?
          </h2>
          <p className="text-primary-200 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of students using CampusVerse to make the most
            of their college experience.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-white text-primary-600 text-base font-bold px-10 py-4 hover:bg-primary-50 hover:shadow-xl transition-all duration-300"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-950 text-white border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <span className="font-bold text-lg text-white">CampusVerse</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                The modern campus operating system for student communities, clubs, and extracurriculars.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link to="/clubs" className="hover:text-white transition-colors">Club Directory</Link></li>
                <li><Link to="/events" className="hover:text-white transition-colors">Upcoming Events</Link></li>
                <li><Link to="/announcements" className="hover:text-white transition-colors">Announcements</Link></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Student Dashboard</Link></li>
              </ul>
            </div>

            {/* Security & Access */}
            <div>
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4">Campus Trust</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                College-scoped data isolation with role-based access control and verified student accounts.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 border border-gray-800 px-3 py-1 text-xs text-primary-400 font-medium">
                <Shield className="h-3.5 w-3.5" />
                <span>Verified College Network</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <span>&copy; {new Date().getFullYear()} CampusVerse. Built for student life.</span>
            <div className="flex items-center gap-6">
              <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-gray-400 cursor-pointer">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
