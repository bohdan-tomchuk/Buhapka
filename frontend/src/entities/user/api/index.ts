import apiClient from '../../../shared/api/base'
import type { User, LoginCredentials, AuthResponse } from '../../../shared/types'

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  return await apiClient('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function logoutApi(): Promise<void> {
  await apiClient('/auth/logout', {
    method: 'POST',
  })
}

export async function refreshApi(): Promise<AuthResponse> {
  return await apiClient('/auth/refresh', {
    method: 'POST',
  })
}

export async function getCurrentUser(): Promise<User> {
  return await apiClient('/auth/me', {
    method: 'GET',
  })
}
