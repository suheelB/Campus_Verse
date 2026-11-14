import { apiClient } from './api'
import type {
  EventDto,
  EventCreateRequest,
  EventUpdateRequest,
  EventRegistrationDto,
  EventAttendanceDto,
  AttendanceReportDto,
  CheckInRequest,
  EventStatus,
} from '@/types/event'

export interface EventPage {
  content: EventDto[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const eventsApi = {
  list: (params?: {
    clubId?: string
    status?: EventStatus
    search?: string
    upcoming?: boolean
    page?: number
    size?: number
  }) => apiClient.get<EventPage>('/events', { params }).then((res) => res.data),

  get: (id: string) =>
    apiClient.get<EventDto>('/events/' + id).then((res) => res.data),

  create: (data: EventCreateRequest) =>
    apiClient.post<EventDto>('/events', data).then((res) => res.data),

  update: (id: string, data: EventUpdateRequest) =>
    apiClient.put<EventDto>('/events/' + id, data).then((res) => res.data),

  publish: (id: string) =>
    apiClient.post<EventDto>('/events/' + id + '/publish').then((res) => res.data),

  cancel: (id: string) =>
    apiClient.post<EventDto>('/events/' + id + '/cancel').then((res) => res.data),

  approve: (id: string) =>
    apiClient.post<EventDto>('/events/' + id + '/approve').then((res) => res.data),

  reject: (id: string, reason?: string) =>
    apiClient.post<EventDto>('/events/' + id + '/reject', { reason }).then((res) => res.data),

  register: (id: string) =>
    apiClient.post<EventRegistrationDto>('/events/' + id + '/register').then((res) => res.data),

  cancelRegistration: (id: string) =>
    apiClient.delete('/events/' + id + '/register'),

  myRegistrations: () =>
    apiClient.get<EventRegistrationDto[]>('/events/registrations/me').then((res) => res.data),

  registrations: (id: string) =>
    apiClient.get<EventRegistrationDto[]>('/events/' + id + '/registrations').then((res) => res.data),

  checkIn: (id: string, data: CheckInRequest) =>
    apiClient.post<EventAttendanceDto>('/events/' + id + '/check-in', data).then((res) => res.data),

  attendance: (id: string) =>
    apiClient.get<EventAttendanceDto[]>('/events/' + id + '/attendance').then((res) => res.data),

  report: (id: string) =>
    apiClient.get<AttendanceReportDto>('/events/' + id + '/attendance/report').then((res) => res.data),
}
