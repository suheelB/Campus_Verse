import { apiClient } from './api'
import type { Announcement, AnnouncementPage, AnnouncementRequest } from '@/types/announcement'

export const announcementsApi = {
  feed: (params?: { page?: number; size?: number }) =>
    apiClient.get<AnnouncementPage>('/announcements/feed', { params }).then((res) => res.data),

  get: (id: string) =>
    apiClient.get<Announcement>('/announcements/' + id).then((res) => res.data),

  create: (data: AnnouncementRequest) =>
    apiClient.post<Announcement>('/announcements', data).then((res) => res.data),

  update: (id: string, data: AnnouncementRequest) =>
    apiClient.put<Announcement>('/announcements/' + id, data).then((res) => res.data),

  acknowledge: (id: string) =>
    apiClient.post<Announcement>('/announcements/' + id + '/acknowledge').then((res) => res.data),

  markRead: (id: string) =>
    apiClient.post('/announcements/' + id + '/read'),

  clubHistory: (clubId: string, params?: { page?: number }) =>
    apiClient.get<AnnouncementPage>('/announcements/club/' + clubId, { params }).then((res) => res.data),

  mine: () =>
    apiClient.get<Announcement[]>('/announcements/mine').then((res) => res.data),
}
