export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'ATTENDED'
  | 'NO_SHOW';

export type AttendanceMethod = 'MANUAL' | 'QR';

export interface EventDto {
  id: string;
  collegeId: string;
  primaryClubId: string;
  clubName: string;
  title: string;
  description: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  venue?: string;
  capacity?: number;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  registeredCount: number;
  waitlistedCount: number;
  isUserRegistered: boolean;
  userRegistrationStatus?: RegistrationStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface EventCreateRequest {
  primaryClubId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue?: string;
  capacity?: number;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  publishNow?: boolean;
}

export interface EventUpdateRequest {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue?: string;
  capacity?: number;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
}

export interface EventRegistrationDto {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string;
  waitlistPosition?: number;
}

export interface EventAttendanceDto {
  id: string;
  eventId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  checkedInAt: string;
  checkedInByName: string;
  method: AttendanceMethod;
}

export interface AttendanceReportDto {
  eventId: string;
  eventTitle: string;
  capacity?: number;
  totalRegistered: number;
  totalWaitlisted: number;
  totalAttended: number;
  attendanceRatePercent: number;
}

export interface CheckInRequest {
  userId?: string;
  userEmail?: string;
  method?: AttendanceMethod;
}
