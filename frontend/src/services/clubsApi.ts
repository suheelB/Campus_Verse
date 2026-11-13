import { apiClient } from './api'
import type { Club, ClubCategory, ClubPage, ClubRole, Membership } from '@/types/club'

export const clubsApi = {
  list: (params: { search?: string; category?: string; page?: number }) =>
    apiClient.get<ClubPage>('/clubs', { params }).then((res) => res.data),
  categories: () => apiClient.get<ClubCategory[]>('/clubs/categories').then((res) => res.data),
  get: (id: string) => apiClient.get<Club>('/clubs/' + id).then((res) => res.data),
  request: (data: { name: string; description: string; categorySlug?: string; contactEmail?: string }) =>
    apiClient.post<Club>('/clubs', data).then((res) => res.data),
  mine: () => apiClient.get<Club[]>('/clubs/mine').then((res) => res.data),
  pendingApprovals: () => apiClient.get<Club[]>('/clubs/requests').then((res) => res.data),
  approve: (id: string) => apiClient.post<Club>('/clubs/' + id + '/approve').then((res) => res.data),
  reject: (id: string, reason: string) => apiClient.post<Club>('/clubs/' + id + '/reject', { reason }).then((res) => res.data),
  myMemberships: () => apiClient.get<Membership[]>('/memberships/me').then((res) => res.data),
  apply: (clubId: string) => apiClient.post<Membership>('/memberships/clubs/' + clubId).then((res) => res.data),
  leave: (clubId: string) => apiClient.delete('/memberships/clubs/' + clubId),
  membershipRequests: (clubId: string) => apiClient.get<Membership[]>('/clubs/' + clubId + '/membership-requests').then((res) => res.data),
  members: (clubId: string) => apiClient.get<Membership[]>('/clubs/' + clubId + '/members').then((res) => res.data),
  roles: (clubId: string) => apiClient.get<ClubRole[]>('/clubs/' + clubId + '/roles').then((res) => res.data),
  decideMembership: (id: string, approve: boolean) =>
    apiClient.post<Membership>('/memberships/' + id + (approve ? '/approve' : '/reject')).then((res) => res.data),
  assignRole: (id: string, roleId: string) => apiClient.put<Membership>('/memberships/' + id + '/role', { roleId }).then((res) => res.data),
}
