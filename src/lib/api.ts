import { Account, Profile, HealthRecord, Session } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  const result: ApiResponse<T> = await response.json()

  if (!result.success) {
    throw new ApiError(
      result.error?.code || 'API_ERROR',
      result.error?.message || 'An unexpected error occurred',
      result.error?.details
    )
  }

  return result.data as T
}

// Auth API
export const authApi = {
  async signIn(email: string, password: string, rememberMe: boolean): Promise<Session> {
    return request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    })
  },

  async signUp(email: string, password: string, fullName: string): Promise<Session> {
    return request<Session>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    })
  },

  async signInDemo(): Promise<Session> {
    return request<Session>('/auth/demo', {
      method: 'POST',
    })
  },

  async signOut(): Promise<void> {
    return request<void>('/auth/logout', {
      method: 'POST',
    })
  },

  async requestPasswordReset(email: string): Promise<void> {
    return request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },

  async verifyEmail(token: string): Promise<void> {
    return request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    return request<{ token: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
    })
  },
}

// Profiles API
export const profilesApi = {
  async list(accountId: string): Promise<Profile[]> {
    return request<Profile[]>(`/profiles?accountId=${accountId}`)
  },

  async get(id: string): Promise<Profile> {
    return request<Profile>(`/profiles/${id}`)
  },

  async create(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Profile> {
    return request<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    })
  },

  async update(id: string, profile: Partial<Profile>): Promise<Profile> {
    return request<Profile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/profiles/${id}`, {
      method: 'DELETE',
    })
  },

  async setDefault(id: string): Promise<Profile> {
    return request<Profile>(`/profiles/${id}/set-default`, {
      method: 'POST',
    })
  },
}

// Health Records API
export const recordsApi = {
  async list(profileId: string, filters?: {
    category?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<HealthRecord[]> {
    const params = new URLSearchParams({ profileId })
    if (filters?.category) params.set('category', filters.category)
    if (filters?.startDate) params.set('startDate', filters.startDate)
    if (filters?.endDate) params.set('endDate', filters.endDate)
    if (filters?.limit) params.set('limit', filters.limit.toString())

    return request<HealthRecord[]>(`/records?${params.toString()}`)
  },

  async get(id: string): Promise<HealthRecord> {
    return request<HealthRecord>(`/records/${id}`)
  },

  async create(record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
    return request<HealthRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(record),
    })
  },

  async update(id: string, record: Partial<HealthRecord>): Promise<HealthRecord> {
    return request<HealthRecord>(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    })
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/records/${id}`, {
      method: 'DELETE',
    })
  },

  // Batch operations
  async batchCreate(records: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<HealthRecord[]> {
    return request<HealthRecord[]>('/records/batch', {
      method: 'POST',
      body: JSON.stringify({ records }),
    })
  },

  async batchDelete(ids: string[]): Promise<void> {
    return request<void>('/records/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    })
  },
}

// Analytics API
export const analyticsApi = {
  async getDashboardData(profileId: string): Promise<{
    todayStats: {
      totalEvents: number
      bpReadings: number
      coffeeCount: number
    }
    latestBP: {
      systolic: number
      diastolic: number
      pulse: number
      time: string
      classification: string
    } | null
    latestStress: {
      level: number
      time: string
    } | null
    sleepStats: {
      lastNight: number
      quality: string
      average7Days: number
    }
    exerciseStats: {
      thisWeek: number
      average7Days: number
    }
  }> {
    return request(`/analytics/dashboard?profileId=${profileId}`)
  },

  async getTrends(profileId: string, params: {
    metric: 'blood_pressure' | 'sleep' | 'exercise' | 'stress'
    period: '7d' | '14d' | '30d' | '90d'
  }): Promise<Array<{
    date: string
    value: number
    metadata?: any
  }>> {
    return request(`/analytics/trends?profileId=${profileId}&metric=${params.metric}&period=${params.period}`)
  },

  async getInsights(profileId: string): Promise<Array<{
    type: 'trend' | 'alert' | 'achievement'
    title: string
    description: string
    severity?: 'low' | 'medium' | 'high'
    date: string
    relatedRecords?: string[]
  }>> {
    return request(`/analytics/insights?profileId=${profileId}`)
  },

  async getClassifications(profileId: string, dateRange: {
    start: string
    end: string
  }): Promise<{
    bloodPressure: {
      normal: number
      elevated: number
      stage1: number
      stage2: number
      crisis: number
    }
  }> {
    return request(`/analytics/classifications?profileId=${profileId}`, {
      method: 'POST',
      body: JSON.stringify(dateRange),
    })
  },
}

// Reports API
export const reportsApi = {
  async generate(profileId: string, params: {
    startDate: string
    endDate: string
    format: 'json' | 'csv' | 'pdf'
  }): Promise<{
    id: string
    downloadUrl: string
    expiresAt: string
  }> {
    return request(`/reports/generate?profileId=${profileId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async list(profileId: string): Promise<Array<{
    id: string
    startDate: string
    endDate: string
    format: string
    createdAt: string
    downloadUrl: string
  }>> {
    return request(`/reports?profileId=${profileId}`)
  },

  async share(reportId: string, params: {
    expiresIn?: number // hours
    password?: string
  }): Promise<{
    shareUrl: string
    shareId: string
    expiresAt: string
  }> {
    return request(`/reports/${reportId}/share`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async email(reportId: string, recipientEmail: string): Promise<void> {
    return request(`/reports/${reportId}/email`, {
      method: 'POST',
      body: JSON.stringify({ recipientEmail }),
    })
  },
}

// Goals API
export const goalsApi = {
  async list(profileId: string): Promise<Array<{
    id: string
    goalType: string
    targetValue: number
    currentValue: number
    unit: string
    startDate: string
    endDate?: string
    status: 'active' | 'achieved' | 'paused'
    progress: number
  }>> {
    return request(`/goals?profileId=${profileId}`)
  },

  async create(profileId: string, goal: {
    goalType: string
    targetValue: number
    unit: string
    startDate: string
    endDate?: string
  }): Promise<any> {
    return request(`/goals?profileId=${profileId}`, {
      method: 'POST',
      body: JSON.stringify(goal),
    })
  },

  async update(id: string, goal: Partial<any>): Promise<any> {
    return request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    })
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/goals/${id}`, {
      method: 'DELETE',
    })
  },

  async getProgress(profileId: string): Promise<{
    bpGoal: { current: number; target: number; progress: number } | null
    sleepGoal: { current: number; target: number; progress: number } | null
    exerciseGoal: { current: number; target: number; progress: number } | null
    waterGoal: { current: number; target: number; progress: number } | null
  }> {
    return request(`/goals/progress?profileId=${profileId}`)
  },
}

// Settings API
export const settingsApi = {
  async get(): Promise<{
    notifications: {
      medication: boolean
      dailyLog: boolean
      weeklyReport: boolean
      trendAlerts: boolean
    }
    preferences: {
      theme: 'dark' | 'light'
      timezone: string
      dateFormat: string
      units: 'metric' | 'imperial'
    }
  }> {
    return request('/settings')
  },

  async update(settings: any): Promise<void> {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },

  async exportData(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/settings/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    return response.blob()
  },

  async importData(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}/settings/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Import failed')
    }
  },
}

// Integrations API
export const integrationsApi = {
  async list(): Promise<Array<{
    id: string
    name: string
    type: 'wearable' | 'ehr' | 'fitness'
    status: 'connected' | 'disconnected' | 'error'
    lastSync?: string
  }>> {
    return request('/integrations')
  },

  async connect(type: string, authData: any): Promise<any> {
    return request('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ type, authData }),
    })
  },

  async disconnect(id: string): Promise<void> {
    return request<void>(`/integrations/${id}`, {
      method: 'DELETE',
    })
  },

  async sync(id: string): Promise<{ synced: number; errors: number }> {
    return request(`/integrations/${id}/sync`, {
      method: 'POST',
    })
  },
}

// Utility functions
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function handleApiError(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}