import React from 'react'
import { Heart, Activity, Moon, BarChart3 } from 'lucide-react'
import { EnvBadge } from '../ui/EnvBadge'

const features = [
  { icon: Heart, title: 'Blood Pressure Tracking', desc: 'Multiple readings per day with trend analysis', color: 'text-danger' },
  { icon: Moon, title: 'Sleep & Exercise', desc: 'Comprehensive wellness monitoring', color: 'text-warn' },
  { icon: BarChart3, title: 'Doctor Reports', desc: 'Professional PDF exports for appointments', color: 'text-info' },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg">
      <div className="hidden md:flex flex-col justify-between px-16 py-16 border-r border-border">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center">
              <Heart size={22} className="text-brand" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                VitalTrack <EnvBadge />
              </div>
              <div className="text-xs text-muted leading-tight">Health Monitor v2.0</div>
            </div>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Your health,
            <br />
            tracked precisely.
          </h1>
          <p className="text-muted text-lg max-w-md leading-relaxed">
            Monitor blood pressure, sleep, exercise, meals, and symptoms in one place. Share
            professional reports with your doctor.
          </p>
        </div>
        <div className="space-y-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-start gap-4">
              <Icon size={22} className={color} />
              <div>
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center">
              <Heart size={22} className="text-brand" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                VitalTrack <EnvBadge />
              </div>
              <div className="text-xs text-muted leading-tight">Health Monitor</div>
            </div>
          </div>
          {children}
          <p className="text-center text-xs text-muted mt-10">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            {' · '}
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  )
}
