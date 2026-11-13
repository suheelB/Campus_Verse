import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './api'
import { clubsApi } from './clubsApi'

afterEach(() => vi.restoreAllMocks())

describe('clubsApi', () => {
  it('sends directory filters and returns the backend page', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, number: 2, size: 20 }
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: page } as never)

    await expect(clubsApi.list({ search: 'robotics', category: 'technology-innovation', page: 2 })).resolves.toBe(page)
    expect(get).toHaveBeenCalledWith('/clubs', {
      params: { search: 'robotics', category: 'technology-innovation', page: 2 },
    })
  })

  it('posts membership applications to the persisted endpoint', async () => {
    const membership = { id: 'membership-1', status: 'PENDING' }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: membership } as never)

    await expect(clubsApi.apply('club-1')).resolves.toBe(membership)
    expect(post).toHaveBeenCalledWith('/memberships/clubs/club-1')
  })

  it('posts membership decisions to approve or reject endpoints', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { status: 'ACTIVE' } } as never)
    await clubsApi.decideMembership('mem-1', true)
    expect(post).toHaveBeenCalledWith('/memberships/mem-1/approve')

    await clubsApi.decideMembership('mem-2', false)
    expect(post).toHaveBeenCalledWith('/memberships/mem-2/reject')
  })

  it('sends delete request to leave club', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: null } as never)
    await clubsApi.leave('club-1')
    expect(del).toHaveBeenCalledWith('/memberships/clubs/club-1')
  })
})
