import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Search, UserCheck, Loader2 } from 'lucide-react'
import { eventsApi } from '@/services/eventsApi'
import type { EventRegistrationDto } from '@/types/event'

interface Props {
  eventId: string
  eventTitle: string
  onClose: () => void
}

export function EventCheckInModal({ eventId, eventTitle, onClose }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [notice, setNotice] = useState('')

  const registrationsQuery = useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => eventsApi.registrations(eventId),
  })

  const attendanceQuery = useQuery({
    queryKey: ['event-attendance', eventId],
    queryFn: () => eventsApi.attendance(eventId),
  })

  const checkInMutation = useMutation({
    mutationFn: (params: { userId?: string; userEmail?: string }) =>
      eventsApi.checkIn(eventId, {
        userId: params.userId,
        userEmail: params.userEmail,
        method: 'MANUAL',
      }),
    onSuccess: (data) => {
      setNotice(`Checked in ${data.userDisplayName}!`)
      setManualEmail('')
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-attendance', eventId] })
    },
    onError: (err: any) => {
      setNotice(err.response?.data?.message || 'Check-in failed.')
    },
  })

  const registrations = registrationsQuery.data || []
  const filteredRegs = registrations.filter(
    (r) =>
      r.userDisplayName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase())
  )

  const attendedCount = attendanceQuery.data?.length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Event Check-In Desk
            </h2>
            <p className="text-xs text-slate-500">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">
            ✕
          </button>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex justify-between items-center shrink-0">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="font-bold hover:underline">
              ✕
            </button>
          </div>
        )}

        {/* Overview Stats */}
        <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span>Total Registered: <strong>{registrations.length}</strong></span>
          <span>Checked In: <strong className="text-emerald-700">{attendedCount}</strong></span>
        </div>

        {/* Quick Manual Check In Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (manualEmail.trim()) {
              checkInMutation.mutate({ userEmail: manualEmail.trim() })
            }
          }}
          className="flex gap-2 shrink-0"
        >
          <input
            type="email"
            placeholder="Check in by student email..."
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={checkInMutation.isPending || !manualEmail.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
          >
            Check In
          </button>
        </form>

        {/* Search registered participants */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search roster by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Roster List */}
        <div className="overflow-y-auto flex-1 border rounded-lg divide-y divide-slate-100">
          {registrationsQuery.isLoading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Loading roster...</span>
            </div>
          ) : filteredRegs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching registrations found.
            </div>
          ) : (
            filteredRegs.map((reg: EventRegistrationDto) => (
              <div key={reg.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-800">{reg.userDisplayName}</p>
                  <p className="text-slate-500">{reg.userEmail}</p>
                </div>

                <div className="flex items-center gap-2">
                  {reg.status === 'ATTENDED' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                    </span>
                  ) : (
                    <button
                      onClick={() => checkInMutation.mutate({ userId: reg.userId })}
                      disabled={checkInMutation.isPending}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-md border border-indigo-200 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
