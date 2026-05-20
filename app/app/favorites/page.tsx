'use client'

import { useState, useEffect } from 'react'
import { Star, Plus, BookOpen } from 'lucide-react'
import Link from 'next/link'
import SourceCard from '@/components/SourceCard'
import { getSites, type Source } from '@/lib/api'

export default function FavoritesPage() {
  const [sources,  setSources]  = useState<Source[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getSites({ pinned: true }).then(data => {
      setSources(data || [])
      setLoading(false)
    })
  }, [])

  function handleDelete(id: string) { setSources(prev => prev.filter(s => s.id !== id)) }
  function handleUpdate(updated: Source) {
    if (!updated.pinned) setSources(prev => prev.filter(s => s.id !== updated.id))
    else setSources(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
          <Star className="w-4 h-4" style={{ color: '#fbbf24' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Favorites</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            {loading ? 'Loading…' : `${sources.length} pinned source${sources.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#0f0f24' }} />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(251,191,36,0.1)' }}>
            <BookOpen className="w-8 h-8" style={{ color: '#fbbf24' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No favorites yet</h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: '#9ca3af' }}>
            Pin sources from your library to surface them here for quick access.
          </p>
          <Link
            href="/app/library"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            Browse Library
          </Link>
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
