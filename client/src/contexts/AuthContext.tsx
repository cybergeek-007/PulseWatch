import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import type { IUserProfile, ILoginRequest, ICreateUserRequest } from '@pulsewatch/shared'

interface AuthContextType {
  user: IUserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: ILoginRequest) => Promise<void>
  register: (data: ICreateUserRequest) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return null
      try {
        const response = await authService.getCurrentUser()
        return response.data
      } catch {
        localStorage.removeItem('access_token')
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.data.user)
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Login failed')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Registration failed')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null)
      queryClient.clear()
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Logout failed')
    },
  })

  const login = useCallback(async (data: ILoginRequest) => {
    await loginMutation.mutateAsync(data)
  }, [loginMutation])

  const register = useCallback(async (data: ICreateUserRequest) => {
    await registerMutation.mutateAsync(data)
  }, [registerMutation])

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const value: AuthContextType = {
    user: userData || null,
    isLoading,
    isAuthenticated: !!userData,
    login,
    register,
    logout,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
