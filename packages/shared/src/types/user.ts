import type { Permission } from '../constants/permissions.js'

export interface User {
  id: string
  employee_id: string
  email: string
  full_name: string
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface JwtPayload {
  sub: string
  email: string
  plant_id: string
  permissions: Permission[]
  iat: number
  exp: number
}

export interface AuthenticatedUser {
  id: string
  email: string
  full_name: string
  plant_id: string
  permissions: Permission[]
}
