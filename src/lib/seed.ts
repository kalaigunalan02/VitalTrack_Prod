import { Account, HealthRecord, Profile } from '../types'

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function seedDatabase() {
  const account: Account = {
    id: 'acct_demo',
    email: 'demo@example.com',
    password: 'demo1234',
    createdAt: new Date().toISOString(),
  }

  const profile: Profile = {
    id: 'prof_demo_self',
    accountId: account.id,
    fullName: 'John Smith',
    relationship: 'Self',
    dob: '1975-03-15',
    gender: 'Male',
    height: "5'10\"",
    weight: '170 lbs',
    bloodType: 'O+',
    medicalConditions: 'Hypertension',
    doctorName: 'Dr. Sarah Chen',
    doctorPhone: '(555) 987-6543',
    emergencyContact: '',
    notes: '',
    isSelf: true,
    isDefault: true,
  }

  const records: HealthRecord[] = []
  const push = (r: Omit<HealthRecord, 'id' | 'createdAt'>) =>
    records.push({ ...r, id: uid('rec'), createdAt: new Date().toISOString() })

  // Today: full journal matching the mockups
  const today = todayISO(0)
  push({ profileId: profile.id, category: 'blood', date: today, time: '07:30', fields: { systolic: 123, diastolic: 80, pulse: 73, mealContext: 'N/A' } })
  push({ profileId: profile.id, category: 'meal', date: today, time: '08:00', fields: { type: 'Breakfast', notes: 'Oatmeal, eggs, orange juice' } })
  push({ profileId: profile.id, category: 'meal', date: today, time: '08:20', fields: { type: 'Coffee', notes: '1 cup black coffee' } })
  push({ profileId: profile.id, category: 'meal', date: today, time: '12:45', fields: { type: 'Lunch', notes: 'Salad and lentil soup' } })
  push({ profileId: profile.id, category: 'blood', date: today, time: '13:15', fields: { systolic: 125, diastolic: 82, pulse: 75, mealContext: 'After Meal' } })
  push({ profileId: profile.id, category: 'stress', date: today, time: '15:00', fields: { level: 5 } })
  push({ profileId: profile.id, category: 'exercise', date: today, time: '18:00', fields: { exerciseType: 'Walking', duration: 35, intensity: 'Moderate' } })
  push({ profileId: profile.id, category: 'blood', date: today, time: '21:00', fields: { systolic: 118, diastolic: 77, pulse: 71, mealContext: 'N/A' } })
  push({ profileId: profile.id, category: 'meal', date: today, time: '21:30', fields: { type: 'Dinner', notes: 'Grilled chicken, vegetables' } })
  push({ profileId: profile.id, category: 'sleep', date: today, time: '22:30', fields: { bedTime: '22:30', wakeTime: '06:00', quality: 'Good' } })

  // Past 19 days: BP + sleep + exercise so History/Reports/Dashboard trends have data
  for (let i = 1; i <= 19; i++) {
    const date = todayISO(-i)
    const sys = 118 + Math.round(Math.sin(i / 2) * 10 + (i % 5))
    const dia = 74 + Math.round(Math.cos(i / 3) * 6 + (i % 3))
    const pulse = 65 + (i % 10)
    push({ profileId: profile.id, category: 'blood', date, time: '08:00', fields: { systolic: sys, diastolic: dia, pulse, mealContext: 'N/A' } })
    push({ profileId: profile.id, category: 'sleep', date, time: '23:00', fields: { bedTime: '23:00', wakeTime: `0${6 + (i % 2)}:${i % 2 === 0 ? '30' : '00'}`, quality: i % 4 === 0 ? 'Fair' : 'Good' } })
    push({ profileId: profile.id, category: 'exercise', date, time: '18:00', fields: { exerciseType: i % 3 === 0 ? 'Cycling' : 'Walking', duration: 30 + (i % 5) * 8, intensity: i % 2 === 0 ? 'Moderate' : 'Light' } })
    if (i % 4 === 0) {
      push({ profileId: profile.id, category: 'water', date, time: '10:00', fields: { amount: 250 } })
    }
  }

  return { accounts: [account], profiles: [profile], records }
}
