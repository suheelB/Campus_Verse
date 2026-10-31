export interface AuthResponse {
  token: string
  tokenType: string
  user: UserDto
}

export interface UserDto {
  id: string
  email: string
  displayName: string
  collegeId: string
  collegeSlug: string
  status: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  collegeSlug: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    details: string
  }
}

export interface HealthResponse {
  status: string
  service: string
  timestamp: string
  database: string
  version?: string
  buildTime?: string
}