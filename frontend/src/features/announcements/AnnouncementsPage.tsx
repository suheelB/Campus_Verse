import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Eye, Loader2, Megaphone, Plus, ShieldAlert } from 'lucide-react'
import { announcementsApi } from '@/services/announcementsApi'
import { apiErrorMessage } from '@/services/api'
import { clubsApi } from '@/services/clubsApi'
import { useAuth } from '@/features/auth/AuthContext'
import type { Announcement } from '@/types/announcement'

export function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [unackOnly, setUnackOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState('')

  const feed = useQuery({
    queryKey: ['announcements-feed', page],
    queryFn: () => announcementsApi.feed({ page, size: 15 }),
  })

  const memberships = useQuery({
    queryKey: ['my-clubs'],
    queryFn: clubsApi.myMemberships,
  })

  // Eligible to create if officer in any club or college admin
  const officerMemberships = (memberships.data || []).filter(
    (m) => m.status === 'ACTIVE' && m.roleName?.toLowerCase().includes('officer')
  )
  const canPublish = officerMemberships.length > 0 || !!user?.collegeAdmin

  const createAnnouncement = useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: async () => {
      setNotice('Announcement published successfully.')
      setShowCreate(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['announcements-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
      ])
    },
    onError: (error: unknown) =>
      setNotice(apiErrorMessage(error, 'Could not publish announcement.')),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.acknowledge(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements-feed'] })
    },
  })

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const clubIdVal = String(form.get('clubId') || '')
    createAnnouncement.mutate({
      clubId: clubIdVal === 'COLLEGE' ? null : clubIdVal || null,
      title: String(form.get('title')).trim(),
      body: String(form.get('body')).trim(),
      priority: form.get('priority') as 'NORMAL' | 'IMPORTANT' | 'URGENT',
      audienceType: form.get('audienceType') as 'ALL_COLLEGE' | 'CLUB_MEMBERS' | 'CLUB_OFFICERS',
      requiresAcknowledgement: form.get('requiresAcknowledgement') === 'on',
    })
  }

  let items = feed.data?.content || []
  if (priorityFilter !== 'ALL') {
    items = items.filter((a) => a.priority === priorityFilter)
  }
  if (unackOnly) {
    items = items.filter((a) => a.requiresAcknowledgement && !a.acknowledged)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Campus updates</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Announcements</h1>
          <p className="mt-2 text-gray-600">College and club notices, urgent alerts, and updates.</p>
        </div>
        {canPublish && (
          <button
            className="btn-primary gap-2"
            onClick={() => {
              setShowCreate((v) => !v)
              setNotice('')
            }}
          >
            <Plus className="h-4 w-4" /> Post announcement
          </button>
        )}
      </header>

      {notice && (
        <p role="status" className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {notice}
        </p>
      )}

      {showCreate && (
        <section className="card p-5 sm:p-7" aria-labelledby="create-announcement-title">
          <div className="mb-5">
            <h2 id="create-announcement-title" className="text-xl font-semibold">Post a new announcement</h2>
            <p className="mt-1 text-sm text-gray-600">Target your club members or the entire college.</p>
          </div>
          <form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="label">Posting on behalf of</span>
              <select className="input" name="clubId" required defaultValue={officerMemberships[0]?.clubId || 'COLLEGE'}>
                {officerMemberships.map((m) => (
                  <option key={m.clubId} value={m.clubId}>
                    {m.clubName} (Club)
                  </option>
                ))}
                {user?.collegeAdmin && <option value="COLLEGE">College-wide (Administrators only)</option>}
              </select>
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="label">Title</span>
              <input className="input" name="title" required maxLength={255} placeholder="Announcement headline" />
            </label>

            <label className="space-y-1.5">
              <span className="label">Priority</span>
              <select className="input" name="priority" defaultValue="NORMAL">
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="label">Target audience</span>
              <select className="input" name="audienceType" defaultValue="CLUB_MEMBERS">
                <option value="CLUB_MEMBERS">All Club Members</option>
                <option value="CLUB_OFFICERS">Club Officers Only</option>
                <option value="ALL_COLLEGE">Entire College</option>
              </select>
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="label">Announcement details</span>
              <textarea
                className="input h-32 resize-y"
                name="body"
                required
                maxLength={20000}
                placeholder="Write the full message..."
              />
            </label>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" name="requiresAcknowledgement" className="rounded text-primary-600 focus:ring-primary-500" />
                <span>Require members to acknowledge reading this announcement</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="btn-primary" type="submit" disabled={createAnnouncement.isPending}>
                {createAnnouncement.isPending ? 'Publishing…' : 'Publish announcement'}
              </button>
              <button className="btn-outline" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filters */}
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Filter:</span>
          {['ALL', 'NORMAL', 'IMPORTANT', 'URGENT'].map((p) => (
            <button
              key={p}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                priorityFilter === p ? 'bg-primary-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setPriorityFilter(p)}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={unackOnly}
            onChange={(e) => setUnackOnly(e.target.checked)}
            className="rounded text-primary-600"
          />
          <span>Pending acknowledgement only</span>
        </label>
      </section>

      {/* Feed list */}
      {feed.isLoading && (
        <div className="flex min-h-48 items-center justify-center text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading announcements…
        </div>
      )}

      {feed.isError && (
        <div role="alert" className="card p-8 text-center">
          <p className="font-medium text-red-700">Couldn't load announcements.</p>
          <button className="btn-outline mt-4" onClick={() => void feed.refetch()}>
            Try again
          </button>
        </div>
      )}

      {!feed.isLoading && items.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Megaphone className="h-5 w-5 text-gray-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No announcements found</h2>
          <p className="mt-1 text-sm text-gray-600">You're completely caught up with campus and club updates.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onAcknowledge={() => acknowledgeMutation.mutate(announcement.id)}
            isAcknowledging={acknowledgeMutation.isPending}
          />
        ))}
      </div>

      {feed.data && feed.data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Page {feed.data.number + 1} of {feed.data.totalPages}
          </p>
          <div className="flex gap-2">
            <button className="btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              className="btn-outline"
              disabled={page + 1 >= feed.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({
  announcement,
  onAcknowledge,
  isAcknowledging,
}: {
  announcement: Announcement
  onAcknowledge: () => void
  isAcknowledging: boolean
}) {
  const isUrgent = announcement.priority === 'URGENT'
  const isImportant = announcement.priority === 'IMPORTANT'

  return (
    <article
      className={`card p-5 sm:p-6 transition-all ${
        isUrgent
          ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
          : isImportant
          ? 'border-amber-300 bg-amber-50/30'
          : ''
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              <ShieldAlert className="h-3.5 w-3.5" /> Urgent
            </span>
          )}
          {isImportant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" /> Important
            </span>
          )}
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
            {announcement.clubName || 'College Notice'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(announcement.publishAt || announcement.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-gray-500">Posted by {announcement.authorName}</p>
      </header>

      <div className="mt-3">
        <h2 className="text-lg font-bold text-gray-950">{announcement.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{announcement.body}</p>
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-gray-400" /> {announcement.readCount} views
          </span>
          {announcement.requiresAcknowledgement && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {announcement.acknowledgedCount} acknowledged
            </span>
          )}
        </div>

        <div>
          {announcement.requiresAcknowledgement && (
            announcement.acknowledged ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Acknowledged
              </span>
            ) : (
              <button
                className="btn-primary !py-1.5 !px-3 text-xs"
                disabled={isAcknowledging}
                onClick={onAcknowledge}
              >
                Acknowledge reading
              </button>
            )
          )}
        </div>
      </footer>
    </article>
  )
}
