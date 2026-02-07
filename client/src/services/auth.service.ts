import api, { ApiResponse } from './api'
import type { 
  IAuthResponse, 
  ILoginRequest, 
  ICreateUserRequest,
  IPasswordResetRequest,
  IPasswordResetConfirm,
  IUserProfile 
} from '@pulsewatch/shared'

export const authService = {
  // Register new user
  async register(data: ICreateUserRequest): Promise<ApiResponse<{ user: IUserProfile; message: string }>> {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  // Login user
  async login(data: ILoginRequest): Promise<ApiResponse<IAuthResponse>> {
    const response = await api.post('/auth/login', data)
    const { access_token } = response.data.data
    localStorage.setItem('access_token', access_token)
    return response.data
  },

  // Logout user
  async logout(): Promise<void> {
    await api.post('/auth/logout')
    localStorage.removeItem('access_token')
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ access_token: string; refresh_token: string; expires_in: number }>> {
    const response = await api.post('/auth/refresh')
    const { access_token } = response.data.data
    localStorage.setItem('access_token', access_token)
    return response.data
  },

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<IUserProfile>> {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Request password reset
  async requestPasswordReset(data: IPasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/auth/password-reset-request', data)
    return response.data
  },

  // Confirm password reset
  async confirmPasswordReset(data: IPasswordResetConfirm): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/auth/password-reset-confirm', data)
    return response.data
  },

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },
}
