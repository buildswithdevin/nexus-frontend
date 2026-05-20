'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import SourceCard from '@/components/SourceCard'
import { getSites, type Source } from '@/lib/api'

export default function RecentPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSites({ limit: 20 }).then(data => {
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setSources(sorted.slice(0, 20))
      setLoading(false)
    })
  }, [])

  function handleDelete(id: string) { setSources(prev => prev.filter(s => s.id !== id)) }
  function handleUpdate(u: Source) { setSources(prev => prev.map(s => s.id === u.id ? u : s)) }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <Clock className="w-4 h-4" style={{ color: '#818cf8' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Recent</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>Last 20 sources added</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#0f0f24' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map(source => (
            <SourceCard key={source.id} source={source} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}
