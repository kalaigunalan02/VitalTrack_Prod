/**
 * Data layer for VitalTrack.
 *
 * Two backends, selected automatically:
 *  - Supabase (cloud) when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set.
 *  - localStorage (offline fallback) otherwise — so the app stays runnable
 *    before cloud keys are configured.
 *
 * Every exported function keeps the SAME signature in both modes, so the rest
 * of the app (contexts, pages) never branches on the backend.
 *
 * To complete the move to cloud only, fill in .env.development /
 * .env.production and run supabase/schema.sql in each project.
 */
import { Account, Profile, HealthRecord, Session } from '../types'
import { supabase, isSupabaseConfigured } from './supabase'

// ---------------------------------------------------------------------------
// LocalStorage fallback (the original mock backend).
// ---------------------------------------------------------------------------
import { seedDatabase } from './seed'

const DB_KEY = 'vitaltrack_db_v1'
const SESSION_KEY = 'vitaltrack_session_v1'
// Active-profile selection is a client preference regardless of backend.
const ACTIVE_PROFILE_KEY = 'vitaltrack_active_profile_v1'

interface DB {
  accounts: Account[]
  profiles: Profile[]
  records: HealthRecord[]
}

function loadDB(): DB {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) return JSON.parse(raw)
  const seeded = seedDatabase()
  localStorage.setItem(DB_KEY, JSON.stringify(seeded))
  return seeded
}

function saveDB(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

// ---------------------------------------------------------------------------
// Mappers: DB snake_case rows  <->  TS camelCase types.
// ---------------------------------------------------------------------------

// Profile row shape from Supabase (snake_case + account_id).
interface ProfileRow {
  id: string
  account_id: string
  full_name: string
  relationship: string | null
  dob: string | null
  gender: string | null
  height: string | null
  weight: string | null
  blood_type: string | null
  medical_conditions: string | null
  doctor_name: string | null
  doctor_phone: string | null
  emergency_contact: string | null
  notes: string | null
  is_self: boolean
  is_default: boolean
  created_at?: string
}

function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    accountId: r.account_id,
    fullName: r.full_name,
    relationship: r.relationship ?? 'Self',
    dob: r.dob ?? '',
    gender: r.gender ?? '',
    height: r.height ?? '',
    weight: r.weight ?? '',
    bloodType: r.blood_type ?? 'Unknown',
    medicalConditions: r.medical_conditions ?? '',
    doctorName: r.doctor_name ?? '',
    doctorPhone: r.doctor_phone ?? '',
    emergencyContact: r.emergency_contact ?? '',
    notes: r.notes ?? '',
    isSelf: r.is_self,
    isDefault: r.is_default,
  }
}

function profileToRow(p: Profile): Partial<ProfileRow> {
  return {
    id: p.id,
    account_id: p.accountId,
    full_name: p.fullName,
    relationship: p.relationship,
    dob: p.dob || null,
    gender: p.gender || null,
    height: p.height || null,
    weight: p.weight || null,
    blood_type: p.bloodType || null,
    medical_conditions: p.medicalConditions || null,
    doctor_name: p.doctorName || null,
    doctor_phone: p.doctorPhone || null,
    emergency_contact: p.emergencyContact || null,
    notes: p.notes || null,
    is_self: p.isSelf,
    is_default: p.isDefault,
  }
}

interface RecordRow {
  id: string
  profile_id: string
  account_id: string
  category: HealthRecord['category']
  entry_date: string
  entry_time: string | null
  data: Record<string, any>
  notes: string | null
  source?: string
  created_at?: string
}

function rowToRecord(r: RecordRow): HealthRecord {
  return {
    id: r.id,
    profileId: r.profile_id,
    category: r.category,
    date: r.entry_date,
    time: r.entry_time ?? '',
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    fields: r.data ?? {},
  }
}

function recordToRow(r: Pick<HealthRecord, 'profileId' | 'category' | 'date' | 'time' | 'fields' | 'notes'> & { id?: string }, accountId: string): Partial<RecordRow> {
  const row: Partial<RecordRow> = {
    profile_id: r.profileId,
    account_id: accountId,
    category: r.category,
    entry_date: r.date,
    entry_time: r.time || null,
    data: r.fields,
    notes: r.notes ?? null,
  }
  if (r.id) row.id = r.id
  return row
}

// ---------------------------------------------------------------------------
// Helpers for the Supabase path.
// ---------------------------------------------------------------------------

async function resolveAccountId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
  return data.user.id
}

/** Resolve the active profile id for the current user (default profile or
 *  the last client-selected one). */
async function resolveActiveProfileId(accountId: string): Promise<string> {
  const stored = localStorage.getItem(`${ACTIVE_PROFILE_KEY}:${accountId}`)
  if (stored) return stored
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('account_id', accountId)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) throw new Error('No profile found for account')
  return data.id
}

function toSession(accountId: string, activeProfileId: string): Session {
  const session: Session = { accountId, activeProfileId, rememberMe: true }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

// ===========================================================================
// AUTH
// ===========================================================================

export async function signUp(email: string, password: string, fullName: string): Promise<Session> {
  if (!isSupabaseConfigured) return signUpLocal(email, password, fullName)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Sign-up failed')
  // The DB trigger creates the default profile; fetch it.
  const accountId = data.user.id
  const activeProfileId = await resolveActiveProfileId(accountId)
  return toSession(accountId, activeProfileId)
}

export async function signIn(email: string, password: string, _rememberMe: boolean): Promise<Session> {
  if (!isSupabaseConfigured) return signInLocal(email, password, _rememberMe)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Invalid email or password.')
  const accountId = data.user.id
  const activeProfileId = await resolveActiveProfileId(accountId)
  return toSession(accountId, activeProfileId)
}

export async function signInDemo(): Promise<Session> {
  // Demo/guest uses a seeded account in Dev (demo@example.com / demo1234).
  // In fallback mode it's the local seeded account.
  return signIn('demo@example.com', 'demo1234', true)
}

/**
 * Returns:
 *   true  = email definitely exists in Supabase Auth
 *   false = email definitely does NOT exist
 *   null  = could not determine (edge function missing/errored) → caller
 *           should default the user to the PASSWORD screen, not registration,
 *           so an existing user is never wrongly sent to sign up.
 *
 * The edge function is required because the browser anon key cannot read
 * auth.users. If it's not deployed, this returns null and the caller treats
 * the user as existing (the safe default for login).
 */
export async function accountExists(email: string): Promise<boolean | null> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    return delay(db.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase()))
  }
  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke<{
      exists?: boolean
      error?: string
    }>('check-email', { body: { email } })
    if (fnError) return null // unknown — do NOT treat as new
    return Boolean(fnData?.exists)
  } catch {
    return null // unknown — do NOT treat as new
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  if (!isSupabaseConfigured) return delay({ ok: true }, 400)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/forgot-password`,
  })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null
  const accountId = data.session.user.id
  try {
    const activeProfileId = await resolveActiveProfileId(accountId)
    return toSession(accountId, activeProfileId)
  } catch {
    return null
  }
}

export async function setActiveProfile(profileId: string) {
  // Client-side preference in both modes.
  const session = await getSession()
  if (!session) return
  localStorage.setItem(`${ACTIVE_PROFILE_KEY}:${session.accountId}`, profileId)
  session.activeProfileId = profileId
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem(SESSION_KEY)
}

export async function getAccount(accountId: string): Promise<Account | undefined> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    return delay(db.accounts.find((a) => a.id === accountId))
  }
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user || user.id !== accountId) return undefined
  // Password is no longer stored (Supabase Auth owns it).
  return { id: user.id, email: user.email ?? '', password: '', createdAt: user.created_at ?? '' }
}

// ===========================================================================
// PROFILES
// ===========================================================================

export async function listProfiles(accountId: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    return delay(db.profiles.filter((p) => p.accountId === accountId))
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('account_id', accountId)
    .order('is_default', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as ProfileRow[]).map(rowToProfile)
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    const idx = db.profiles.findIndex((p) => p.id === profile.id)
    if (idx >= 0) db.profiles[idx] = profile
    else db.profiles.push(profile)
    saveDB(db)
    return delay(profile)
  }
  const row = profileToRow(profile)
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', profile.id).maybeSingle()
  if (existing) {
    const { data, error } = await supabase.from('profiles').update(row).eq('id', profile.id).select().single()
    if (error) throw new Error(error.message)
    return rowToProfile(data as ProfileRow)
  }
  const { data, error } = await supabase.from('profiles').insert(row).select().single()
  if (error) throw new Error(error.message)
  return rowToProfile(data as ProfileRow)
}

export async function deleteProfile(profileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    db.profiles = db.profiles.filter((p) => p.id !== profileId)
    db.records = db.records.filter((r) => r.profileId !== profileId)
    saveDB(db)
    return delay(undefined)
  }
  // ON DELETE CASCADE removes the profile's records automatically.
  const { error } = await supabase.from('profiles').delete().eq('id', profileId)
  if (error) throw new Error(error.message)
}

// ===========================================================================
// RECORDS
// ===========================================================================

export async function listRecords(profileId: string): Promise<HealthRecord[]> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    return delay(
      db.records
        .filter((r) => r.profileId === profileId)
        .sort((a, b) => (a.date + a.time > b.date + b.time ? -1 : 1))
    )
  }
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('profile_id', profileId)
    .order('entry_date', { ascending: false })
    .order('entry_time', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as RecordRow[]).map(rowToRecord)
}

export async function addRecord(record: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
  if (!isSupabaseConfigured) {
    const full: HealthRecord = { ...record, id: uid('rec'), createdAt: new Date().toISOString() }
    const db = loadDB()
    db.records.push(full)
    saveDB(db)
    return delay(full)
  }
  const accountId = await resolveAccountId()
  const { data, error } = await supabase
    .from('health_records')
    .insert(recordToRow(record, accountId))
    .select()
    .single()
  if (error) throw new Error(error.message)
  return rowToRecord(data as RecordRow)
}

export async function updateRecord(record: HealthRecord): Promise<HealthRecord> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    const idx = db.records.findIndex((r) => r.id === record.id)
    if (idx >= 0) db.records[idx] = record
    saveDB(db)
    return delay(record)
  }
  const accountId = await resolveAccountId()
  const { data, error } = await supabase
    .from('health_records')
    .update(recordToRow(record, accountId))
    .eq('id', record.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return rowToRecord(data as RecordRow)
}

export async function deleteRecord(recordId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const db = loadDB()
    db.records = db.records.filter((r) => r.id !== recordId)
    saveDB(db)
    return delay(undefined)
  }
  const { error } = await supabase.from('health_records').delete().eq('id', recordId)
  if (error) throw new Error(error.message)
}

// ===========================================================================
// Local-only auth helpers (fallback mode implementations).
// ===========================================================================

async function signUpLocal(email: string, password: string, fullName: string): Promise<Session> {
  const db = loadDB()
  if (db.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with that email already exists.')
  }
  const account: Account = { id: uid('acct'), email, password, createdAt: new Date().toISOString() }
  const profile: Profile = {
    id: uid('prof'),
    accountId: account.id,
    fullName,
    relationship: 'Self',
    dob: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: 'Unknown',
    medicalConditions: '',
    doctorName: '',
    doctorPhone: '',
    emergencyContact: '',
    notes: '',
    isSelf: true,
    isDefault: true,
  }
  db.accounts.push(account)
  db.profiles.push(profile)
  saveDB(db)
  const session: Session = { accountId: account.id, activeProfileId: profile.id, rememberMe: true }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return delay(session)
}

async function signInLocal(email: string, password: string, rememberMe: boolean): Promise<Session> {
  const db = loadDB()
  const account = db.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase())
  if (!account || account.password !== password) {
    throw new Error('Invalid email or password.')
  }
  const defaultProfile = db.profiles.find((p) => p.accountId === account.id && p.isDefault) || db.profiles.find((p) => p.accountId === account.id)
  const session: Session = { accountId: account.id, activeProfileId: defaultProfile!.id, rememberMe }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return delay(session)
}
