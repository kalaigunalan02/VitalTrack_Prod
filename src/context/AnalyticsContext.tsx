import React, { createContext, useContext } from 'react'

// Local-mode stub.
//
// In the original scaffolding this context called a REST backend
// (analyticsApi / goalsApi) that was never implemented. Dashboard.tsx already
// computes every dashboard number client-side from `records` via useData(), and
// every analytics read in Dashboard is paired with a `?? clientValue` fallback.
// So in local mode this provider simply serves empty data and the client-side
// fallbacks take over. The insights alerts panel will show nothing until the
// real backend exists (Option C).
//
// The provider + hooks are kept (with their original signatures) so Dashboard's
// imports don't change. When the backend lands, restore the real fetch logic
// here.

interface DashboardData {
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
}

interface TrendPoint {
  date: string
  value: number
  metadata?: any
}

interface Insight {
  type: 'trend' | 'alert' | 'achievement'
  title: string
  description: string
  severity?: 'low' | 'medium' | 'high'
  date: string
  relatedRecords?: string[]
}

interface GoalProgress {
  bpGoal: { current: number; target: number; progress: number } | null
  sleepGoal: { current: number; target: number; progress: number } | null
  exerciseGoal: { current: number; target: number; progress: number } | null
  waterGoal: { current: number; target: number; progress: number } | null
}

interface AnalyticsContextValue {
  dashboardData: DashboardData | null
  trends: Record<string, TrendPoint[]>
  insights: Insight[]
  goalProgress: GoalProgress | null
  loading: boolean
  error: string | null

  refreshDashboard: () => Promise<void>
  refreshTrends: (metric: string, period: string) => Promise<void>
  refreshInsights: () => Promise<void>
  refreshGoalProgress: () => Promise<void>
  clearError: () => void
}

const noop = async () => {}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const value: AnalyticsContextValue = {
    dashboardData: null,
    trends: {},
    insights: [],
    goalProgress: null,
    loading: false,
    error: null,
    refreshDashboard: noop,
    refreshTrends: noop,
    refreshInsights: noop,
    refreshGoalProgress: noop,
    clearError: noop,
  }

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider')
  return ctx
}

// Hook for specific trend data
export function useTrends(metric: string, period: string = '14d') {
  const { trends, refreshTrends, loading } = useAnalytics()
  const key = `${metric}_${period}`
  const data = trends[key] || []
  return { data, loading, refresh: () => refreshTrends(metric, period) }
}

// Hook for insights filtering
export function useInsights(type?: 'trend' | 'alert' | 'achievement') {
  const { insights, refreshInsights, loading } = useAnalytics()

  const filteredInsights = type ? insights.filter((insight) => insight.type === type) : insights

  return {
    insights: filteredInsights,
    allInsights: insights,
    loading,
    refresh: refreshInsights,
  }
}

// Hook for goal progress
export function useGoalProgress() {
  const { goalProgress, refreshGoalProgress, loading } = useAnalytics()

  return { progress: goalProgress, loading, refresh: refreshGoalProgress }
}
