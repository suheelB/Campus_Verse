import { Link } from 'react-router-dom'
import { BookOpen, Users, Calendar, Megaphone, Shield } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Discover Clubs',
    description: 'Find and join clubs matching your interests, skills, and schedule.',
  },
  {
    icon: Calendar,
    title: 'Events & Registration',
    description: 'Browse events, register with one click, and get checked in seamlessly.',
  },
  {
    icon: Megaphone,
    title: 'Smart Announcements',
    description: 'Receive targeted announcements with read receipts and acknowledgements.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'College-scoped data isolation with role-based access control.',
  },
]

export function LandingPage() {
  return (
    <div className="flex flex-col items-center text-center px-4 py-20">
      <div className="mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 mb-6">
          <BookOpen className="h-4 w-4" />
          <span>Campus Community Operating System</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl mb-6">
          One organized home for every <span className="text-primary-600">club</span>, <span className="text-primary-600">event</span>, and <span className="text-primary-600">student</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          CampusVerse helps students discover clubs, join activities, organize events, collaborate across clubs, and build a verified record of extracurricular contributions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            Get Started Free
          </Link>
          <Link to="/login" className="btn-outline text-lg px-8 py-3">
            Sign In
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card p-6 text-left hover:shadow-md transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 w-full max-w-5xl">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to transform campus life?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of students using CampusVerse to make the most of their college experience.
          </p>
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  )
}