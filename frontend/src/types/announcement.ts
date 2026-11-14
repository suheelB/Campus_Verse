export interface Announcement {
  id: string
  collegeId: string
  clubId: string | null
  clubName: string | null
  authorId: string
  authorName: string
  title: string
  body: string
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
  audienceType: 'ALL_COLLEGE' | 'CLUB_MEMBERS' | 'CLUB_OFFICERS'
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED'
  publishAt: string
  expiresAt: string | null
  requiresAcknowledgement: boolean
  createdAt: string
  read: boolean
  acknowledged: boolean
  readCount: number
  acknowledgedCount: number
}

export interface AnnouncementPage {
  content: Announcement[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface AnnouncementRequest {
  clubId?: string | null
  title: string
  body: string
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT'
  audienceType?: 'ALL_COLLEGE' | 'CLUB_MEMBERS' | 'CLUB_OFFICERS'
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  publishAt?: string
  expiresAt?: string | null
  requiresAcknowledgement?: boolean
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  resourceType: string | null
  resourceId: string | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  content: Notification[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}
