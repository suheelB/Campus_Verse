import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './api'
import { eventsApi } from './eventsApi'

afterEach(() => vi.restoreAllMocks())

describe('eventsApi', () => {
  it('fetches events list with filter params', async () => {
    const page = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: page } as never)

    await expect(eventsApi.list({ search: 'hackathon', upcoming: true })).resolves.toBe(page)
    expect(get).toHaveBeenCalledWith('/events', { params: { search: 'hackathon', upcoming: true } })
  })

  it('registers user for an event', async () => {
    const registration = { id: 'reg-1', eventId: 'evt-1', status: 'REGISTERED' }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: registration } as never)

    await expect(eventsApi.register('evt-1')).resolves.toBe(registration)
    expect(post).toHaveBeenCalledWith('/events/evt-1/register')
  })

  it('cancels registration', async () => {
    const del = vi.spyOn(apiClient, 'delete').mockResolvedValue({ data: null } as never)

    await eventsApi.cancelRegistration('evt-1')
    expect(del).toHaveBeenCalledWith('/events/evt-1/register')
  })

  it('checks in attendee', async () => {
    const checkInData = { userId: 'u-1', method: 'MANUAL' as const }
    const res = { id: 'att-1', eventId: 'evt-1', userId: 'u-1' }
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: res } as never)

    await expect(eventsApi.checkIn('evt-1', checkInData)).resolves.toBe(res)
    expect(post).toHaveBeenCalledWith('/events/evt-1/check-in', checkInData)
  })

  it('fetches attendance report', async () => {
    const report = {
      eventId: 'evt-1',
      eventTitle: 'Hackathon',
      totalRegistered: 50,
      totalWaitlisted: 5,
      totalAttended: 42,
      attendanceRatePercent: 84.0,
    }
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: report } as never)

    await expect(eventsApi.report('evt-1')).resolves.toBe(report)
    expect(get).toHaveBeenCalledWith('/events/evt-1/attendance/report')
  })
})
