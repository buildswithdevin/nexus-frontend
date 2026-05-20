'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tag, Search, X } from 'lucide-react'
import SourceCard from '@/components/SourceCard'
import { getSites, type Source } from '@/lib/api'

export default function TagsPage() {
  const [sources,     setSources]     = useState<Source[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeTag,   setActiveTag]   = useState<string | null>(null)
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    getSites().then(data => {
      setSources(data || [])
      setLoading(false)
    })
  }, [])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    sources.forEach(s => (s.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [sources])

  const filteredTags = search
    ? tagCounts.filter(([t]) => t.toLowerCase().includes(search.toLowerCase()))
    : tagCounts

  const filteredSources = activeTag
    ? sources.filter(s => (s.tags || []).includes(activeTag))
    : []

  function handleDelete(id: string) { setSources(prev => prev.filter(s => s.id !== id)) }
  function handleUpdate(u: Source) { setSources(prev => prev.map(s => s.id === u.id ? u : s)) }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
          <Tag className="w-4 h-4" style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tags</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            {loading ? 'Loading…' : `${tagCounts.length} unique tag${tagCounts.length !== 1 ? 's' : ''} across ${sources.length} sources`}
          </p>
        </div>
      </div>

      {/* Search tags */}
      <div
        className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border"
        style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7280' }} />
        <input
          type="text"
          placeholder="Search tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
        {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /></button>}
      </div>

      {/* Tag cloud */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-8">
          {filteredTags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={activeTag === tag
                ? { background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {tag}
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: activeTag === tag ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)' }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Sources for selected tag */}
      {activeTag && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-white">Sources tagged</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
              {activeTag}
            </span>
            <span className="text-xs" style={{ color: '#6b7280' }}>({filteredSources.length} sources)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.map(source => (
              <SourceCard key={source.id} source={source} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
