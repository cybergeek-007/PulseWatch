import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorService } from '@/services/monitor.service'
import type { ICreateMonitorRequest, IUpdateMonitorRequest, IMonitorFilters } from '@pulsewatch/shared'

export function useMonitors(filters: IMonitorFilters = {}) {
  return useQuery({
    queryKey: ['monitors', filters],
    queryFn: async () => {
      const response = await monitorService.list(filters)
      return response.data
    },
  })
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: ['monitor', id],
    queryFn: async () => {
      const response = await monitorService.get(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ICreateMonitorRequest) => monitorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}

export function useUpdateMonitor(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: IUpdateMonitorRequest) => monitorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['monitor', id] })
    },
  })
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => monitorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}

export function usePauseMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => monitorService.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}

export function useResumeMonitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => monitorService.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}
