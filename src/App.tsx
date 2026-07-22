import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { AnalyticsProvider } from './context/AnalyticsContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import EmailStep from './pages/auth/EmailStep'
import PasswordStep from './pages/auth/PasswordStep'
import Dashboard from './pages/Dashboard'
import AddRecord from './pages/AddRecord'
import History from './pages/History'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/email" element={<EmailStep />} />
            <Route path="/auth/password" element={<PasswordStep />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-record" element={<AddRecord />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DataProvider>
      </AnalyticsProvider>
    </AuthProvider>
  )
}

export default App