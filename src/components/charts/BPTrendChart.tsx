import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'

export function BPTrendChart({ data }: { data: { date: string; systolic: number; diastolic: number; pulse: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" stroke="#8B94A8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#8B94A8" fontSize={12} tickLine={false} axisLine={false} domain={[50, 150]} />
        <Tooltip contentStyle={{ background: '#1B2338', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
        <Area type="monotone" dataKey="systolic" stroke="#F87171" fill="#F87171" fillOpacity={0.15} strokeWidth={2} />
        <Area type="monotone" dataKey="diastolic" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.1} strokeWidth={2} />
        <Area type="monotone" dataKey="pulse" stroke="#34D399" fill="#34D399" fillOpacity={0.08} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Legend() {
  const items = [
    { color: '#60A5FA', label: 'Diastolic' },
    { color: '#34D399', label: 'Pulse' },
    { color: '#F87171', label: 'Systolic' },
  ]
  return (
    <div className="flex items-center justify-center gap-6 mt-2 text-sm text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
