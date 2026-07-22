import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { HealthRecord, Profile } from '../types'
import { useAuth } from './AuthContext'
import * as storage from '../lib/storage'

interface DataContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  records: HealthRecord[]
  loading: boolean
  error: string | null
  refreshing: boolean

  // Profile operations
  refreshProfiles: () => Promise<void>
  saveProfile: (p: Profile) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  setActiveProfile: (id: string) => Promise<void>

  // Record operations
  refreshRecords: (showRefreshing?: boolean) => Promise<void>
  addRecord: (r: Omit<HealthRecord, 'id' | 'createdAt' | 'profileId'>) => Promise<HealthRecord>
  updateRecord: (r: HealthRecord) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  addRecords: (records: Omit<HealthRecord, 'id' | 'createdAt' | 'profileId'>[]) => Promise<HealthRecord[]>

  // Utility functions
  clearError: () => void
  getRecordsByDate: (date: string) => HealthRecord[]
  getRecordsByCategory: (category: string) => HealthRecord[]
  getRecordsInRange: (start: string, end: string) => HealthRecord[]
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

// Sort newest-first by date then time.
function byNewest(a: HealthRecord, b: HealthRecord): number {
  return a.date + a.time > b.date + b.time ? -1 : 1
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session, setActiveProfile: setAuthActiveProfile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshProfiles = useCallback(async () => {
    if (!session) return

    try {
      const data = await storage.listProfiles(session.accountId)
      setProfiles(data)
      setError(null)
    } catch (err) {
      setError(errMsg(err))
      console.error('Failed to refresh profiles:', err)
    }
  }, [session])

  const refreshRecords = useCallback(async (showRefreshing = false) => {
    if (!session) return

    try {
      if (showRefreshing) setRefreshing(true)
      const data = await storage.listRecords(session.activeProfileId)
      setRecords([...data].sort(byNewest))
      setError(null)
    } catch (err) {
      setError(errMsg(err))
      console.error('Failed to refresh records:', err)
    } finally {
      if (showRefreshing) setRefreshing(false)
    }
  }, [session])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      if (session) {
        await Promise.all([refreshProfiles(), refreshRecords()])
      } else {
        setProfiles([])
        setRecords([])
      }
    } finally {
      setLoading(false)
    }
  }, [session, refreshProfiles, refreshRecords])

  useEffect(() => {
    refreshAll()
  }, [session, refreshAll])

  const activeProfile = profiles.find((p) => p.id === session?.activeProfileId) ?? null

  const saveProfile = useCallback(async (profile: Profile) => {
    try {
      setError(null)
      const saved = await storage.saveProfile(profile)
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id)
        return idx >= 0 ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]
      })
    } catch (err) {
      setError(errMsg(err))
      throw err
    }
  }, [])

  const deleteProfile = useCallback(async (id: string) => {
    try {
      setError(null)
      await storage.deleteProfile(id)
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      setRecords((prev) => prev.filter((r) => r.profileId !== id))
    } catch (err) {
      setError(errMsg(err))
      throw err
    }
  }, [])

  // Profile switching is owned by AuthContext (it writes the active profile to
  // the session). Here we delegate to it; the session change triggers
  // refreshAll above, which reloads records for the new profile.
  const setActiveProfile = useCallback(
    async (id: string) => {
      setAuthActiveProfile(id)
      await refreshRecords(true)
    },
    [setAuthActiveProfile, refreshRecords]
  )

  const addRecord = useCallback(
    async (record: Omit<HealthRecord, 'id' | 'createdAt' | 'profileId'>): Promise<HealthRecord> => {
      if (!session) throw new Error('No active session')

      try {
        setError(null)
        const created = await storage.addRecord({
          ...record,
          profileId: session.activeProfileId,
        })
        setRecords((prev) => [created, ...prev])
        return created
      } catch (err) {
        setError(errMsg(err))
        refreshRecords(true)
        throw err
      }
    },
    [session, refreshRecords]
  )

  // storage has no native batch; loop addRecord. Public method preserved so
  // AddRecord/import flows keep working.
  const addRecords = useCallback(
    async (
      recordsToAdd: Omit<HealthRecord, 'id' | 'createdAt' | 'profileId'>[]
    ): Promise<HealthRecord[]> => {
      if (!session) throw new Error('No active session')

      try {
        setError(null)
        const created: HealthRecord[] = []
        for (const r of recordsToAdd) {
          created.push(await storage.addRecord({ ...r, profileId: session.activeProfileId }))
        }
        setRecords((prev) => [...created, ...prev])
        return created
      } catch (err) {
        setError(errMsg(err))
        refreshRecords(true)
        throw err
      }
    },
    [session, refreshRecords]
  )

  const updateRecord = useCallback(
    async (record: HealthRecord) => {
      try {
        setError(null)
        const updated = await storage.updateRecord(record)
        setRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)))
      } catch (err) {
        setError(errMsg(err))
        refreshRecords(true)
        throw err
      }
    },
    [refreshRecords]
  )

  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await storage.deleteRecord(id)
        setRecords((prev) => prev.filter((r) => r.id !== id))
      } catch (err) {
        setError(errMsg(err))
        refreshRecords(true)
        throw err
      }
    },
    [refreshRecords]
  )

  const getRecordsByDate = useCallback(
    (date: string) => records.filter((r) => r.date === date),
    [records]
  )

  const getRecordsByCategory = useCallback(
    (category: string) => records.filter((r) => r.category === category),
    [records]
  )

  const getRecordsInRange = useCallback(
    (start: string, end: string) => records.filter((r) => r.date >= start && r.date <= end),
    [records]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: DataContextValue = {
    profiles,
    activeProfile,
    records,
    loading,
    error,
    refreshing,
    refreshProfiles,
    refreshRecords,
    saveProfile,
    deleteProfile,
    setActiveProfile,
    addRecord,
    updateRecord,
    deleteRecord,
    addRecords,
    clearError,
    getRecordsByDate,
    getRecordsByCategory,
    getRecordsInRange,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
