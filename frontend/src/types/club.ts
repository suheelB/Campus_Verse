export interface Club {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  categoryName: string | null
  categorySlug: string | null
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED'
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'
  contactEmail: string | null
  memberCount: number
  createdAt: string | null
  rejectionReason: string | null
}

export interface ClubCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

export interface ClubPage {
  content: Club[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface Membership {
  id: string
  clubId: string
  clubName: string
  userId: string
  displayName: string
  roleName: string
  roleId: string | null
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LEFT' | 'REVOKED' | 'INVITED'
  appliedAt: string
  rejectionReason: string | null
}

export interface ClubRole {
  id: string
  name: string
  displayName: string
  description: string | null
}
