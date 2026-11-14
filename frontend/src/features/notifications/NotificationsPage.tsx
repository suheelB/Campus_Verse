import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react'
import { notificationsApi } from '@/services/notificationsApi'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const notifications = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.list({ page, size: 20 }),
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
      ])
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
      ])
    },
  })

  const items = notifications.data?.content || []
  const hasUnread = items.some((n) => !n.readAt)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Inbox</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Notifications</h1>
          <p className="mt-2 text-gray-600">Club updates, announcement notices, and activity alerts.</p>
        </div>
        {hasUnread && (
          <button
            className="btn-outline gap-2 text-sm"
            disabled={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </header>

      {notifications.isLoading && (
        <div className="flex min-h-48 items-center justify-center text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading notifications…
        </div>
      )}

      {notifications.isError && (
        <div role="alert" className="card p-8 text-center">
          <p className="font-medium text-red-700">Couldn't load notifications.</p>
          <button className="btn-outline mt-4" onClick={() => void notifications.refetch()}>
            Try again
          </button>
        </div>
      )}

      {!notifications.isLoading && items.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No notifications yet</h2>
          <p className="mt-1 text-sm text-gray-600">You'll receive alerts when announcements or club decisions are posted.</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {items.map((item) => {
            const isUnread = !item.readAt
            return (
              <li
                key={item.id}
                className={`flex items-start justify-between gap-4 p-5 transition-colors ${
                  isUnread ? 'bg-primary-50/30' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      isUnread ? 'bg-primary-600' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className={`text-sm ${isUnread ? 'font-bold text-gray-950' : 'font-medium text-gray-800'}`}>
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 leading-6">{item.body}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {isUnread && (
                  <button
                    className="btn-ghost shrink-0 text-xs text-gray-500 hover:text-primary-700"
                    title="Mark as read"
                    disabled={markReadMutation.isPending}
                    onClick={() => markReadMutation.mutate(item.id)}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {notifications.data && notifications.data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Page {notifications.data.number + 1} of {notifications.data.totalPages}
          </p>
          <div className="flex gap-2">
            <button className="btn-outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              className="btn-outline"
              disabled={page + 1 >= notifications.data.totalPages}
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
