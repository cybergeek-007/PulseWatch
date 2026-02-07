import api, { ApiResponse, PaginatedResponse } from './api'
import type { 
  IMonitor, 
  IMonitorWithStats,
  ICreateMonitorRequest, 
  IUpdateMonitorRequest,
  IMonitorListResponse,
  IMonitorFilters
} from '@pulsewatch/shared'

export const monitorService = {
  // Create a new monitor
  async create(data: ICreateMonitorRequest): Promise<ApiResponse<IMonitor>> {
    const response = await api.post('/monitors', data)
    return response.data
  },

  // List all monitors
  async list(filters: IMonitorFilters = {}): Promise<ApiResponse<IMonitorListResponse>> {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)

    const response = await api.get(`/monitors?${params.toString()}`)
    return response.data
  },

  // Get a single monitor
  async get(id: string): Promise<ApiResponse<IMonitorWithStats>> {
    const response = await api.get(`/monitors/${id}`)
    return response.data
  },

  // Update a monitor
  async update(id: string, data: IUpdateMonitorRequest): Promise<ApiResponse<IMonitor>> {
    const response = await api.put(`/monitors/${id}`, data)
    return response.data
  },

  // Delete a monitor
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/monitors/${id}`)
    return response.data
  },

  // Pause a monitor
  async pause(id: string): Promise<ApiResponse<IMonitor>> {
    const response = await api.post(`/monitors/${id}/pause`)
    return response.data
  },

  // Resume a monitor
  async resume(id: string): Promise<ApiResponse<IMonitor>> {
    const response = await api.post(`/monitors/${id}/resume`)
    return response.data
  },
}
