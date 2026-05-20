'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, BookOpen, Plus, SlidersHorizontal, X, Pin } from 'lucide-react'
import Link from 'next/link'
import SourceCard from '@/components/SourceCard'
import { getSites, getEnrichmentStatus, type Source, type EnrichmentStatusItem } from '@/lib/api'

const ALL_CATEGORIES = [
  'All',
  // Technical
  'AI & ML', 'Development', 'Cybersecurity', 'Robotics', 'Embedded Systems',
  'Design', 'Data Science', 'Cloud & DevOps', 'Hardware',
  // Knowledge
  'Research', 'Productivity', 'Education',
  // General
  'News & Media', 'Food & Cooking', 'Health & Wellness',
  'Science', 'Business & Finance', 'Entertainment', 'Other',
]

type SortKey = 'newest' | 'oldest' | 'az' | 'pinned'

export default function LibraryPage() {
  const [sources,      setSources]      = useState<Source[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortKey,      setSortKey]      = useState<SortKey>('newest')
  const [showFilters,  setShowFilters]  = useState(false)
  const [pinnedOnly,   setPinnedOnly]   = useState(false)

  const pendingIdsRef = useRef<string[]>([])

  const hasPendingEnrichment = sources.some(
    s => s.enrichment_status === 'pending' || s.enrichment_status === 'processing'
  )

  // Keep ref fresh
  useEffect(() => {
    pendingIdsRef.current = sources
      .filter(s => s.enrichment_status === 'pending' || s.enrichment_status === 'processing')
      .map(s => s.id)
  }, [sources])

  // Poll enrichment status for in-progress saves
  useEffect(() => {
    if (!hasPendingEnrichment) return
    const interval = setInterval(async () => {
      const ids = pendingIdsRef.current
      if (!ids.length) return
      const statuses = await getEnrichmentStatus(ids)
      if (!statuses?.length) return
      setSources(prev => prev.map(s => {
        const up = statuses.find((st: EnrichmentStatusItem) => st.id === s.id)
        if (!up) return s
        return {
          ...s,
          enrichment_status: up.enrichment_status,
          category: up.category || s.category,
          tags: up.tags?.length ? up.tags : s.tags,
          summary: up.summary || s.summary,
          description: up.description || s.description,
          enrichment_error: up.enrichment_error,
        }
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [hasPendingEnrichment])

  const loadSources = () => {
    setLoading(true)
    setError(false)
    getSites().then(data => {
      if (data !== null) {
        setSources(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
  }

  useEffect(() => { loadSources() }, [])

  function handleDelete(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  function handleUpdate(updated: Source) {
    setSources(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  const filtered = useMemo(() => {
    let list = [...sources]

    if (pinnedOnly) list = list.filter(s => s.pinned)
    if (activeFilter !== 'All') list = list.filter(s => s.category === activeFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.summary ?? '').toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        (s.notes ?? '').toLowerCase().includes(q) ||
        (s.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
        (s.topics ?? []).some(t => t.toLowerCase().includes(q))
      )
    }

    switch (sortKey) {
      case 'newest': list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'az':     list.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'pinned': list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); break
    }

    return list
  }, [sources, searchQuery, activeFilter, sortKey, pinnedOnly])

  const usedCategories = useMemo(() => {
    const cats = new Set(sources.map(s => s.category).filter(Boolean))
    return ALL_CATEGORIES.filter(c => c === 'All' || cats.has(c))
  }, [sources])

  const pinnedCount = sources.filter(s => s.pinned).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Your Library</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            {loading ? 'Loading…' : error ? 'Could not load library' : `${sources.length} source${sources.length !== 1 ? 's' : ''}${pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
            style={{
              background: showFilters ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
              color: showFilters ? '#a78bfa' : '#9ca3af',
              border: '1px solid',
              borderColor: showFilters ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          <Link
            href="/app/add"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <Plus className="w-4 h-4" />
            Add Source
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-violet-500/40"
        style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7280' }} />
        <input
          type="text"
          placeholder="Search titles, summaries, tags, notes…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="flex-shrink-0 hover:bg-white/10 p-0.5 rounded">
            <X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="mb-4 p-4 rounded-xl border space-y-3"
          style={{ background: '#0a0a18', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>Sort</p>
            <div className="flex items-center gap-1.5">
              {(['newest', 'oldest', 'az', 'pinned'] as SortKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                  style={sortKey === k
                    ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af' }
                  }
                >
                  {k === 'newest' ? 'Newest' : k === 'oldest' ? 'Oldest' : k === 'az' ? 'A→Z' : 'Pinned first'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPinnedOnly(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={pinnedOnly
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
                : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af' }
              }
            >
              <Pin className="w-3 h-3" />
              Pinned only
            </button>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {usedCategories.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={activeFilter === tab
              ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 0 14px rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af' }
            }
          >
            {tab}
            {tab !== 'All' && (
              <span className="ml-1.5 opacity-60">
                {sources.filter(s => s.category === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#0f0f24' }} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <BookOpen className="w-8 h-8" style={{ color: '#f87171' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Backend not reachable</h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: '#9ca3af' }}>
            Could not connect to {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}. Make sure the backend is running.
          </p>
          <button
            onClick={loadSources}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <BookOpen className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? 'No results found' : pinnedOnly ? 'No pinned sources' : 'Your library is empty'}
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: '#9ca3af' }}>
            {searchQuery
              ? `Nothing matches "${searchQuery}" — try different keywords or browse by category.`
              : pinnedOnly
              ? 'Pin sources to surface them here quickly.'
              : 'Save articles, videos, tools, research, or anything worth remembering. NEXUS organizes it automatically.'}
          </p>
          {!searchQuery && !pinnedOnly && (
            <Link
              href="/app/add"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              <Plus className="w-4 h-4" />
              Add your first source
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
            Showing {filtered.length} of {sources.length} source{sources.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(source => (
              <div key={source.id} className="relative">
                <SourceCard
                  source={source}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
