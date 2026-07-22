import React from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'

export function BarChartCard({
  data,
  dataKey,
  color,
  domainMax,
  goalLine,
}: {
  data: { label: string; value: number }[]
  dataKey?: string
  color: string
  domainMax: number
  goalLine?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" stroke="#8B94A8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#8B94A8" fontSize={12} tickLine={false} axisLine={false} domain={[0, domainMax]} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        {goalLine !== undefined && (
          <ReferenceLine y={goalLine} stroke={color} strokeDasharray="4 4" label={{ value: `${goalLine}h goal`, position: 'insideTopRight', fill: color, fontSize: 11 }} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
