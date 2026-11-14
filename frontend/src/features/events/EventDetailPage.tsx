import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  BarChart2,
  UserCheck,
} from 'lucide-react'
import { eventsApi } from '@/services/eventsApi'
import { clubsApi } from '@/services/clubsApi'
import { useAuth } from '@/features/auth/AuthContext'
import { EventCheckInModal } from './EventCheckInModal'
import type { EventRegistrationDto } from '@/types/event'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [notice, setNotice] = useState<string>('')
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const eventQuery = useQuery({
    queryKey: ['event-detail', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  })

  const registrationsQuery = useQuery({
    queryKey: ['event-registrations', id],
    queryFn: () => eventsApi.registrations(id!),
    enabled: !!id,
    retry: false, // will fail if not officer/admin, which is expected
  })

  const reportQuery = useQuery({
    queryKey: ['event-report', id],
    queryFn: () => eventsApi.report(id!),
    enabled: !!id && showReport,
  })

  const memberships = useQuery({
    queryKey: ['my-clubs'],
    queryFn: clubsApi.myMemberships,
  })

  const event = eventQuery.data
  const isOfficerOrAdmin =
    user?.collegeId != null &&
    (memberships.data || []).some(
      (m) =>
        m.clubId === event?.primaryClubId &&
        m.status === 'ACTIVE'
    )

  const registerMutation = useMutation({
    mutationFn: () => eventsApi.register(id!),
    onSuccess: (res) => {
      setNotice(
        res.status === 'WAITLISTED'
          ? `Placed on waitlist at position #${res.waitlistPosition}!`
          : 'Registration confirmed!'
      )
      queryClient.invalidateQueries({ queryKey: ['event-detail', id] })
    },
    onError: (err: any) =>
      setNotice(err.response?.data?.message || 'Could not register for event.'),
  })

  const cancelRegMutation = useMutation({
    mutationFn: () => eventsApi.cancelRegistration(id!),
    onSuccess: () => {
      setNotice('Registration cancelled.')
      queryClient.invalidateQueries({ queryKey: ['event-detail', id] })
    },
    onError: (err: any) =>
      setNotice(err.response?.data?.message || 'Could not cancel registration.'),
  })

  const publishMutation = useMutation({
    mutationFn: () => eventsApi.publish(id!),
    onSuccess: () => {
      setNotice('Event published.')
      queryClient.invalidateQueries({ queryKey: ['event-detail', id] })
    },
  })

  const cancelEventMutation = useMutation({
    mutationFn: () => eventsApi.cancel(id!),
    onSuccess: () => {
      setNotice('Event cancelled.')
      queryClient.invalidateQueries({ queryKey: ['event-detail', id] })
    },
  })

  if (eventQuery.isLoading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm">Loading event details...</p>
      </div>
    )
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="bg-white rounded-xl p-8 border text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Event Not Found</h2>
        <p className="text-sm text-slate-600">The event could not be found or you do not have permission to view it.</p>
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    )
  }

  const startDate = new Date(event.startsAt)
  const endDate = new Date(event.endsAt)
  const isFull = event.capacity != null && event.registeredCount >= event.capacity
  const capacityPercent =
    event.capacity != null ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Events
        </Link>
      </div>

      {notice && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg flex items-center justify-between text-sm">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Event Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {event.clubName}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  event.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : event.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {event.status}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-start gap-3 text-slate-600">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  {startDate.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600">
              <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Location</p>
                <p className="text-xs text-slate-500">{event.venue || 'Campus venue TBA'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-600">
              <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  {event.capacity != null ? `${event.registeredCount} / ${event.capacity} Seats` : `${event.registeredCount} Registered`}
                </p>
                <p className="text-xs text-slate-500">
                  {event.waitlistedCount > 0 ? `${event.waitlistedCount} on waitlist` : 'Open enrollment'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        {event.capacity != null && (
          <div className="bg-slate-50 px-8 py-3 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
              <span>Registration Capacity</span>
              <span>{capacityPercent}% filled</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  capacityPercent >= 100 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Description & Registration Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About this Event</h2>
            <div className="prose prose-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {event.description}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Organized by {event.createdByName}</span>
              <span>Created on {new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Organizer Admin / Officer Tools */}
          {(isOfficerOrAdmin || registrationsQuery.isSuccess) && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Organizer Control Panel
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCheckIn(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Check In Attendees
                  </button>

                  <button
                    onClick={() => setShowReport(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Turnout Report
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {event.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                  >
                    Publish Event
                  </button>
                )}
                {event.status !== 'CANCELLED' && (
                  <button
                    onClick={() => cancelEventMutation.mutate()}
                    disabled={cancelEventMutation.isPending}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg"
                  >
                    Cancel Event
                  </button>
                )}
              </div>

              {/* Registrations List Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Participants ({registrationsQuery.data?.length || 0})
                </h4>

                <div className="overflow-x-auto max-h-64 border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(registrationsQuery.data || []).map((r: EventRegistrationDto) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-medium text-slate-800">{r.userDisplayName}</td>
                          <td className="p-2.5 text-slate-500">{r.userEmail}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                r.status === 'ATTENDED'
                                  ? 'bg-blue-50 text-blue-700'
                                  : r.status === 'WAITLISTED'
                                  ? 'bg-amber-50 text-amber-700'
                                  : r.status === 'REGISTERED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {r.status} {r.waitlistPosition ? `#${r.waitlistPosition}` : ''}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">
                            {new Date(r.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Registration Card */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
            <h3 className="text-base font-bold text-slate-900">Registration Status</h3>

            {event.userRegistrationStatus === 'REGISTERED' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmed
                </div>
                <p>You have a confirmed seat for this event. Present your name or student ID at check-in.</p>
                <button
                  onClick={() => cancelRegMutation.mutate()}
                  disabled={cancelRegMutation.isPending}
                  className="w-full mt-2 py-2 bg-white border border-rose-200 text-rose-600 font-semibold rounded-lg hover:bg-rose-50"
                >
                  Cancel Registration
                </button>
              </div>
            )}

            {event.userRegistrationStatus === 'WAITLISTED' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> On Waitlist
                </div>
                <p>You are on the waitlist. You will be automatically enrolled if a confirmed seat is cancelled.</p>
                <button
                  onClick={() => cancelRegMutation.mutate()}
                  disabled={cancelRegMutation.isPending}
                  className="w-full mt-2 py-2 bg-white border border-rose-200 text-rose-600 font-semibold rounded-lg hover:bg-rose-50"
                >
                  Leave Waitlist
                </button>
              </div>
            )}

            {event.userRegistrationStatus === 'ATTENDED' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Attended
                </div>
                <p>Your attendance has been recorded for this event. Thank you for participating!</p>
              </div>
            )}

            {!event.isUserRegistered && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  {isFull
                    ? 'All seats are currently filled. Joining the waitlist gives you priority when registered students cancel.'
                    : 'Reserve your spot now. Registration is free for all enrolled college students.'}
                </p>

                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending || event.status !== 'PUBLISHED'}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 ${
                    event.status !== 'PUBLISHED'
                      ? 'bg-slate-400 cursor-not-allowed'
                      : isFull
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isFull ? 'Join Event Waitlist' : 'Register for Event'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check In Modal */}
      {showCheckIn && (
        <EventCheckInModal
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => {
            setShowCheckIn(false)
            queryClient.invalidateQueries({ queryKey: ['event-detail', id] })
            queryClient.invalidateQueries({ queryKey: ['event-registrations', id] })
          }}
        />
      )}

      {/* Attendance Report Modal */}
      {showReport && reportQuery.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Attendance & Turnout Report</h3>
              <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <p className="font-semibold text-slate-800">{reportQuery.data.eventTitle}</p>
                <p className="text-xs text-slate-500">Official Turnout Summary</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs text-indigo-700 font-medium">Total Registered</p>
                  <p className="text-xl font-bold text-indigo-900">{reportQuery.data.totalRegistered}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs text-emerald-700 font-medium">Attended (Checked In)</p>
                  <p className="text-xl font-bold text-emerald-900">{reportQuery.data.totalAttended}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">Waitlisted</p>
                  <p className="text-xl font-bold text-amber-900">{reportQuery.data.totalWaitlisted}</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-xs text-purple-700 font-medium">Turnout Rate</p>
                  <p className="text-xl font-bold text-purple-900">{reportQuery.data.attendanceRatePercent}%</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowReport(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
