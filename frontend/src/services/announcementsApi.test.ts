import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './api'
import { announcementsApi } from './announcementsApi'
import { notificationsApi } from './notificationsApi'

afterEach(() => vi.restoreAllMocks())

describe('announcementsApi', () => {
  it('requests feed with pagination params', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 15 }
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: page } as never)

    await expect(announcementsApi.feed({ page: 1, size: 10 })).resolves.toBe(page)
    expect(get).toHaveBeenCalledWith('/announcements/feed', { params: { page: 1, size: 10 } })
  })

  it('posts announcement creation', async () => {
    const data = { title: 'Test', body: 'Body' }
    const res = { id: 'ann-1', ...data }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: res } as never)

    await expect(announcementsApi.create(data as any)).resolves.toBe(res)
    expect(post).toHaveBeenCalledWith('/announcements', data)
  })

  it('acknowledges an announcement', async () => {
    const res = { id: 'ann-1', acknowledged: true }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: res } as never)

    await expect(announcementsApi.acknowledge('ann-1')).resolves.toBe(res)
    expect(post).toHaveBeenCalledWith('/announcements/ann-1/acknowledge')
  })
})

describe('notificationsApi', () => {
  it('fetches unread count', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 3 } } as never)

    await expect(notificationsApi.unreadCount()).resolves.toEqual({ count: 3 })
    expect(get).toHaveBeenCalledWith('/notifications/unread-count')
  })

  it('marks all as read', async () => {
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: null } as never)

    await notificationsApi.markAllRead()
    expect(put).toHaveBeenCalledWith('/notifications/read-all')
  })
})
