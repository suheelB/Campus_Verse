import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { eventsApi } from '@/services/eventsApi'
import { clubsApi } from '@/services/clubsApi'
import { useAuth } from '@/features/auth/AuthContext'
import type { EventDto } from '@/types/event'

export function EventsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [upcomingOnly, setUpcomingOnly] = useState<boolean | undefined>(true)
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState<string>('')

  // Form states for creating event
  const [createClubId, setCreateClubId] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createStartsAt, setCreateStartsAt] = useState('')
  const [createEndsAt, setCreateEndsAt] = useState('')
  const [createVenue, setCreateVenue] = useState('')
  const [createCapacity, setCreateCapacity] = useState('')
  const [createPublishNow, setCreatePublishNow] = useState(true)

  const eventsQuery = useQuery({
    queryKey: ['events-list', search, upcomingOnly, selectedClub],
    queryFn: () =>
      eventsApi.list({
        search: search.trim() || undefined,
        upcoming: upcomingOnly,
        clubId: selectedClub || undefined,
        size: 30,
      }),
  })

  const memberships = useQuery({
    queryKey: ['my-clubs'],
    queryFn: clubsApi.myMemberships,
  })

  const clubsList = useQuery({
    queryKey: ['clubs-categories'],
    queryFn: () => clubsApi.list({}),
  })

  const activeClubs = clubsList.data?.content || []
  const officerMemberships = (memberships.data || []).filter(
    (m) => m.status === 'ACTIVE'
  )
  const canCreate = officerMemberships.length > 0 || user?.collegeId != null

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.register(eventId),
    onSuccess: (res) => {
      setNotice(
        res.status === 'WAITLISTED'
          ? `Added to waitlist at position #${res.waitlistPosition}!`
          : 'Successfully registered for event!'
      )
      queryClient.invalidateQueries({ queryKey: ['events-list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: (err: any) =>
      setNotice(err.response?.data?.message || 'Could not register for event.'),
  })

  const cancelRegMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.cancelRegistration(eventId),
    onSuccess: () => {
      setNotice('Registration cancelled.')
      queryClient.invalidateQueries({ queryKey: ['events-list'] })
    },
    onError: (err: any) =>
      setNotice(err.response?.data?.message || 'Could not cancel registration.'),
  })

  const createEventMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      setNotice('Event created successfully!')
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['events-list'] })
    },
    onError: (err: any) =>
      setNotice(err.response?.data?.message || 'Failed to create event.'),
  })

  const resetForm = () => {
    setCreateClubId('')
    setCreateTitle('')
    setCreateDescription('')
    setCreateStartsAt('')
    setCreateEndsAt('')
    setCreateVenue('')
    setCreateCapacity('')
    setCreatePublishNow(true)
  }

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!createClubId || !createTitle || !createStartsAt || !createEndsAt) {
      setNotice('Please fill in required fields.')
      return
    }

    createEventMutation.mutate({
      primaryClubId: createClubId,
      title: createTitle,
      description: createDescription,
      startsAt: new Date(createStartsAt).toISOString(),
      endsAt: new Date(createEndsAt).toISOString(),
      venue: createVenue.trim() || undefined,
      capacity: createCapacity ? parseInt(createCapacity, 10) : undefined,
      publishNow: createPublishNow,
    })
  }

  const events: EventDto[] = eventsQuery.data?.content || []

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Campus Events & Workshops
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Discover upcoming activities, register for workshops, and track your attendance.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Host an Event
          </button>
        )}
      </div>

      {/* Global Notice */}
      {notice && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg flex items-center justify-between text-sm">
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Host Clubs</option>
            {activeClubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUpcomingOnly(true)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                upcomingOnly === true
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setUpcomingOnly(false)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                upcomingOnly === false
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past
            </button>
            <button
              type="button"
              onClick={() => setUpcomingOnly(undefined)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                upcomingOnly === undefined
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {eventsQuery.isLoading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No events found</h3>
          <p className="text-sm mt-1 max-w-sm mx-auto">
            {search
              ? 'Try modifying your search or filters.'
              : 'There are no active events scheduled right now. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const startDate = new Date(event.startsAt)
            const endDate = new Date(event.endsAt)
            const isFull = event.capacity != null && event.registeredCount >= event.capacity

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {event.clubName}
                    </span>

                    {event.userRegistrationStatus === 'REGISTERED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                      </span>
                    )}
                    {event.userRegistrationStatus === 'WAITLISTED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Waitlist
                      </span>
                    )}
                    {event.userRegistrationStatus === 'ATTENDED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck className="w-3.5 h-3.5" /> Attended
                      </span>
                    )}
                  </div>

                  <Link to={`/events/${event.id}`}>
                    <h3 className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2">{event.description}</p>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {startDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {endDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {event.registeredCount}{' '}
                        {event.capacity != null ? `/ ${event.capacity} registered` : 'registered'}
                        {event.waitlistedCount > 0 && ` (${event.waitlistedCount} waitlist)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/events/${event.id}`}
                    className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div>
                    {event.isUserRegistered ? (
                      <button
                        onClick={() => cancelRegMutation.mutate(event.id)}
                        disabled={cancelRegMutation.isPending}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50"
                      >
                        Cancel Reg
                      </button>
                    ) : (
                      <button
                        onClick={() => registerMutation.mutate(event.id)}
                        disabled={registerMutation.isPending}
                        className={`text-xs px-3 py-1.5 font-medium rounded-lg text-white shadow-xs transition-colors ${
                          isFull
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {isFull ? 'Join Waitlist' : 'Register Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Host New Event</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Host Club *</label>
                <select
                  required
                  value={createClubId}
                  onChange={(e) => setCreateClubId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Club</option>
                  {activeClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. AI & Robotics Hackathon"
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="What will attendees learn, build, or experience?"
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Starts At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createStartsAt}
                    onChange={(e) => setCreateStartsAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ends At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createEndsAt}
                    onChange={(e) => setCreateEndsAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={createVenue}
                    onChange={(e) => setCreateVenue(e.target.value)}
                    placeholder="e.g. Auditorium Hall B / Zoom link"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Capacity Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={createCapacity}
                    onChange={(e) => setCreateCapacity(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pubNow"
                  checked={createPublishNow}
                  onChange={(e) => setCreatePublishNow(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pubNow" className="text-slate-700 text-xs">
                  Publish event immediately (otherwise submit as proposal)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {createEventMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
