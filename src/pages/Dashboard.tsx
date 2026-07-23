import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Moon, Activity, Coffee, Brain, Heart, PlusCircle, History as HistoryIcon, FileText, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAnalytics, useTrends, useInsights } from '../context/AnalyticsContext'
import { classifyBP } from '../lib/classification'
import { sleepDuration } from '../lib/summary'
import { StatusPill } from '../components/ui/StatusPill'
import { BPTrendChart, Legend } from '../components/charts/BPTrendChart'
import { BarChartCard } from '../components/charts/BarChartCard'
import { LoadingState, ErrorState, ErrorBanner, EmptyState } from '../components/ui/StateComponents'
import { AlertCircle } from 'lucide-react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDateHeading(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const { records, loading, error, refreshing, refreshRecords, clearError } = useData()
  const { dashboardData, loading: analyticsLoading, error: analyticsError, refreshDashboard, clearError: clearAnalyticsError } = useAnalytics()
  const { insights } = useInsights('alert')
  const { data: bpTrends, loading: trendsLoading } = useTrends('blood_pressure', '14d')
  
  const navigate = useNavigate()
  const today = todayISO()

  const todaysRecords = useMemo(() => records.filter((r) => r.date === today), [records, today])
  const todaysBP = todaysRecords.filter((r) => r.category === 'blood')
  const latestBP = todaysBP.sort((a, b) => (a.time > b.time ? -1 : 1))[0]

  const last14 = useMemo(() => {
    const days: { date: string; systolic: number; diastolic: number; pulse: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const bp = records.filter((r) => r.category === 'blood' && r.date === iso)
      if (bp.length) {
        const avg = (key: string) => Math.round(bp.reduce((s, r) => s + r.fields[key], 0) / bp.length)
        days.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), systolic: avg('systolic'), diastolic: avg('diastolic'), pulse: avg('pulse') })
      }
    }
    return days
  }, [records])

  const last7Sleep = useMemo(() => {
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const s = records.find((r) => r.category === 'sleep' && r.date === iso)
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: s ? Number(sleepDuration(s.fields.bedTime, s.fields.wakeTime).toFixed(1)) : 0 })
    }
    return days
  }, [records])

  const last7Exercise = useMemo(() => {
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const total = records.filter((r) => r.category === 'exercise' && r.date === iso).reduce((s, r) => s + Number(r.fields.duration || 0), 0)
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: total })
    }
    return days
  }, [records])

  const lastSleep = [...records].filter((r) => r.category === 'sleep').sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1))[0]
  const exerciseThisWeekMin = last7Exercise.reduce((s, d) => s + d.value, 0)
  const coffeeToday = todaysRecords.filter((r) => r.category === 'meal' && r.fields.type?.toLowerCase() === 'coffee').length
  const latestStress = [...records].filter((r) => r.category === 'stress').sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1))[0]

  const handleRefresh = async () => {
    await Promise.all([
      refreshRecords(),
      refreshDashboard()
    ])
  }

  // Show loading state on initial load
  if (loading && records.length === 0) {
    return <LoadingState message="Loading your health data..." fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {(error || analyticsError) && (
        <ErrorBanner 
          message={error || analyticsError || 'An error occurred'} 
          onDismiss={() => {
            clearError()
            clearAnalyticsError()
          }}
        />
      )}

      {/* Alert Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight) => (
            <div key={insight.date} className={`flex items-start gap-3 p-4 rounded-lg border ${
              insight.severity === 'high' ? 'bg-danger/15 border-danger/40' :
              insight.severity === 'medium' ? 'bg-warn/15 border-warn/40' :
              'bg-brand/15 border-brand/40'
            }`}>
              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                insight.severity === 'high' ? 'text-danger' :
                insight.severity === 'medium' ? 'text-warn' :
                'text-brand'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-sm text-muted mt-1">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{fmtDateHeading(today)}</h2>
          <p className="text-muted text-sm">
            {dashboardData ? `${dashboardData.todayStats.bpReadings} BP readings today` : `${todaysBP.length} BP readings today`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => navigate('/add-record')} className="btn-primary">
            <PlusCircle size={18} /> Add Record
          </button>
        </div>
      </div>

      {/* Latest BP Card */}
      <div className="card bg-brand/10 border-brand/30">
        {latestBP ? (
          <div className="flex flex-nowrap sm:flex-wrap items-end gap-3 sm:gap-10">
            <div className="min-w-0">
              <p className="text-brand text-sm mb-1">Latest Blood Pressure · {latestBP.time}</p>
              <p className="text-3xl sm:text-5xl font-bold whitespace-nowrap">
                {latestBP.fields.systolic}
                <span className="text-muted">/{latestBP.fields.diastolic}</span>
              </p>
              <p className="text-muted text-sm mt-1">mmHg</p>
            </div>
            <div className="border-l border-border pl-3 sm:pl-10 min-w-0">
              <p className="text-muted text-sm mb-1">Pulse</p>
              <p className="text-xl sm:text-3xl font-bold whitespace-nowrap">
                {latestBP.fields.pulse} <span className="text-xs sm:text-base font-normal text-muted">bpm</span>
              </p>
              <div className="mt-2">
                <StatusPill label={classifyBP(latestBP.fields.systolic, latestBP.fields.diastolic)} />
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={24} className="text-brand" />}
            title="No blood pressure reading today"
            description="Log your first reading to start tracking your blood pressure trends."
            action={{
              label: "Add BP Reading",
              onClick: () => navigate('/add-record')
            }}
          />
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Calendar size={18} className="text-info" />} 
          value={dashboardData?.todayStats.totalEvents ?? todaysRecords.length} 
          caption="health events" 
          link="Today's Entries" 
          onClick={() => navigate('/history')} 
        />
        <StatCard
          icon={<Moon size={18} className="text-sleep" />}
          value={lastSleep ? `${sleepDuration(lastSleep.fields.bedTime, lastSleep.fields.wakeTime).toFixed(1)}h` : '—'}
          caption={lastSleep?.fields.quality?.toLowerCase() ?? 'no data'}
          link="Sleep Last Night"
          trend="up"
          onClick={() => navigate('/history')}
        />
        <StatCard 
          icon={<Activity size={18} className="text-brand" />} 
          value={`${dashboardData?.exerciseStats.thisWeek ?? exerciseThisWeekMin}m`} 
          caption="total minutes" 
          link="Exercise This Week" 
          trend="down" 
          onClick={() => navigate('/history')} 
        />
        <StatCard 
          icon={<Coffee size={18} className="text-meal" />} 
          value={String(dashboardData?.todayStats.coffeeCount ?? coffeeToday)} 
          caption="cups" 
          link="Coffee Today" 
          onClick={() => navigate('/add-record')} 
        />
      </div>

      {/* Stress Level */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-warn/15 flex items-center justify-center shrink-0">
          <Brain size={20} className="text-warn" />
        </div>
        <div className="flex-1">
          <p className="text-warn text-sm mb-2">Latest Stress Level</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 flex-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${latestStress && i < latestStress.fields.level ? (i < 6 ? 'bg-brand' : 'bg-warn') : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="font-bold">{dashboardData?.latestStress?.level ?? latestStress?.fields.level ?? 0}/10</span>
          </div>
        </div>
      </div>

      {/* BP Trend Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Heart size={18} className="text-danger" /> Blood Pressure Trend
          </h3>
          <span className="text-muted text-sm">Last 14 days</span>
        </div>
        {trendsLoading ? (
          <LoadingState message="Loading trends..." size="sm" />
        ) : last14.length ? (
          <>
            <BPTrendChart data={last14} />
            <Legend />
          </>
        ) : (
          <EmptyState
            title="No BP trend data"
            description="Log blood pressure readings over multiple days to see trends."
          />
        )}
      </div>

      {/* Sleep and Exercise Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Moon size={18} className="text-sleep" /> Sleep
            </h3>
            <span className="text-muted text-sm">Last 7 days</span>
          </div>
          <BarChartCard data={last7Sleep} color="#818CF8" domainMax={10} goalLine={7} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Activity size={18} className="text-brand" /> Exercise
            </h3>
            <span className="text-muted text-sm">Last 7 days</span>
          </div>
          <BarChartCard data={last7Exercise} color="#4ADE80" domainMax={80} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction icon={<PlusCircle size={20} />} label="Add Today's Record" onClick={() => navigate('/add-record')} />
        <QuickAction icon={<HistoryIcon size={20} />} label="View History" onClick={() => navigate('/history')} />
        <QuickAction icon={<FileText size={20} />} label="Export Report" onClick={() => navigate('/reports')} />
      </div>
    </div>
  )
}

function StatCard({ icon, value, caption, link, trend, onClick }: { icon: React.ReactNode; value: string | number; caption: string; link: string; trend?: 'up' | 'down'; onClick: () => void }) {
  return (
    <div className="card cursor-pointer hover:bg-white/5 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>
        {trend && (trend === 'up' ? <TrendingUp size={16} className="text-brand" /> : <TrendingDown size={16} className="text-danger" />)}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-muted text-sm mb-2">{caption}</p>
      <button className="text-brand text-sm font-medium">
        {link}
      </button>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex flex-col items-center justify-center gap-2 py-8 hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-brand/15 text-brand flex items-center justify-center">{icon}</div>
      <span className="text-sm text-center">{label}</span>
    </button>
  )
}