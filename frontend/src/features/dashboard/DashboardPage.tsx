import { useAuth } from '@/features/auth/AuthContext'
import { BookOpen, Users, Calendar, Megaphone, TrendingUp, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    { label: 'My Clubs', value: '0', icon: Users, href: '/clubs', color: 'text-blue-600 bg-blue-100' },
    { label: 'Upcoming Events', value: '0', icon: Calendar, href: '/events', color: 'text-green-600 bg-green-100' },
    { label: 'Announcements', value: '0', icon: Megaphone, href: '/announcements', color: 'text-purple-600 bg-purple-100' },
    { label: 'Notifications', value: '0', icon: TrendingUp, href: '/notifications', color: 'text-orange-600 bg-orange-100' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName || 'Student'}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening in your campus community
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href} className="card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/clubs" className="btn-outline justify-start gap-3">
              <BookOpen className="h-5 w-5" />
              Browse Clubs
            </Link>
            <Link to="/events" className="btn-outline justify-start gap-3">
              <Calendar className="h-5 w-5" />
              View Events
            </Link>
            <Link to="/clubs/create" className="btn-primary justify-start gap-3">
              <Plus className="h-5 w-5" />
              Create Club
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity yet</p>
            <p className="text-sm mt-1">Join a club or register for an event to get started</p>
          </div>
        </div>
      </div>
    </div>
  )
}