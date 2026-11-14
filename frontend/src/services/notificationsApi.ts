import { apiClient } from './api'
import type { Notification, NotificationPage } from '@/types/announcement'

export const notificationsApi = {
  list: (params?: { page?: number; size?: number }) =>
    apiClient.get<NotificationPage>('/notifications', { params }).then((res) => res.data),

  unreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((res) => res.data),

  markRead: (id: string) =>
    apiClient.put<Notification>('/notifications/' + id + '/read').then((res) => res.data),

  markAllRead: () =>
    apiClient.put('/notifications/read-all'),
}
