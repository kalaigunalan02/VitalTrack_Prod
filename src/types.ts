export type Category =
  | 'blood'
  | 'meal'
  | 'exercise'
  | 'sleep'
  | 'symptoms'
  | 'stress'
  | 'medication'
  | 'water'

export interface Account {
  id: string
  email: string
  password: string // demo-only plaintext store; replace with real auth provider in production
  createdAt: string
}

export interface Profile {
  id: string
  accountId: string
  fullName: string
  relationship: string
  dob: string
  gender: string
  height: string
  weight: string
  bloodType: string
  medicalConditions: string
  doctorName: string
  doctorPhone: string
  emergencyContact: string
  notes: string
  isSelf: boolean
  isDefault: boolean
}

export interface HealthRecord {
  id: string
  profileId: string
  category: Category
  date: string // YYYY-MM-DD
  time: string // HH:MM 24h
  notes?: string
  createdAt: string
  fields: Record<string, any>
}

export interface Session {
  accountId: string
  activeProfileId: string
  rememberMe: boolean
}
