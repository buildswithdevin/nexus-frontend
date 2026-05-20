'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Compass, Sparkles, ArrowRight, Lightbulb, TrendingUp,
  BookOpen, Search, RefreshCw, AlertCircle, Loader2, Zap,
  ChevronRight, Library, ThumbsUp, ThumbsDown, BookmarkPlus,
  CheckCircle, MessageCircle, Clock, Route,
} from 'lucide-react'
import {
  getDiscover, searchDiscover, sendFeedback, ingestSource,
  type DiscoverResponse, type DiscoverSuggestion,
  type BecauseSection, type RecentQuerySection,
  type LearningPath, type DiscoverSearchResult,
} from '@/lib/api'
import DiscoverDetailModal from '@/components/DiscoverDetailModal'

// ── Colour helpers ────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'AI & ML':            { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'AI Tools':           { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'Development':        { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Frontend':           { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Backend':            { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  'Robotics':           { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Robotics & Hardware':{ bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Embedded Systems':   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Productivity':       { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  'Design':             { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  'Research':           { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Data Science':       { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Cloud & DevOps':     { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  'DevOps':             { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  'Hardware':           { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  'Cybersecurity':      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Security':           { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Career':             { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  'Writing':            { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.25)' },
  'Developer Tools':    { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
}

function catColors(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'var(--purple-bg)', text: 'var(--purple-text)', border: 'rgba(139,92,246,0.2)' }
}

function CategoryPill({ category }: { category: string }) {
  const c = catColors(category)
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {category}
    </span>
  )
}

function InterestCloud({ interests }: { interests: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((tag, i) => (
        <span
          key={tag}
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{
            background: `rgba(139,92,246,${0.08 + (interests.length - i) * 0.018})`,
            color: `rgba(167,139,250,${Math.max(0.4, 1 - i * 0.06)})`,
            border: `1px solid rgba(139,92,246,${0.12 + (interests.length - i) * 0.02})`,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

// ── Main recommendation card ──────────────────────────────────────────────────
interface CardState { feedback: 'like' | 'dislike' | null; saved: boolean; saving: boolean; hidden: boolean }

function RecommendationCard({
  suggestion, onAskDetail, onFeedback, onSave, compact = false,
}: {
  suggestion: DiscoverSuggestion
  onAskDetail: (s: DiscoverSuggestion) => void
  onFeedback: (s: DiscoverSuggestion, action: 'like' | 'dislike') => void
  onSave: (s: DiscoverSuggestion) => void
  compact?: boolean
}) {
  const [state, setState] = useState<CardState>({ feedback: null, saved: false, saving: false, hidden: false })
  const [hovered, setHovered] = useState(false)

  if (state.hidden) return null

  const hasUrl = Boolean(suggestion.url)

  const handleCardClick = () => {
    if (hasUrl) window.open(suggestion.url, '_blank', 'noopener,noreferrer')
    else onAskDetail(suggestion)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (state.feedback === 'like') return
    setState(p => ({ ...p, feedback: 'like' }))
    onFeedback(suggestion, 'like')
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (state.feedback === 'dislike') return
    setState(p => ({ ...p, feedback: 'dislike', hidden: true }))
    onFeedback(suggestion, 'dislike')
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasUrl || state.saving || state.saved) return
    setState(p => ({ ...p, saving: true }))
    await onSave(suggestion)
    setState(p => ({ ...p, saving: false, saved: true }))
  }

  const handleDetail = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAskDetail(suggestion)
  }

  const pad = compact ? 'p-4' : 'p-5'

  return (
    <div
      className={`${pad} rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all duration-200 group relative`}
      style={{
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-card)',
        borderColor: hovered ? 'var(--border-hover)' : 'var(--border)',
        boxShadow: hovered ? '0 4px 32px rgba(139,92,246,0.12)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* Header row: category + like/dislike */}
      <div className="flex items-center justify-between gap-2">
        <CategoryPill category={suggestion.category} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleLike}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: state.feedback === 'like' ? '#34d399' : 'var(--text-dim)', background: state.feedback === 'like' ? 'rgba(52,211,153,0.1)' : 'transparent' }}
            title="Like"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDislike}
            className="p-1.5 rounded-lg transition-all duration-150"
            style={{ color: state.feedback === 'dislike' ? '#f87171' : 'var(--text-dim)', background: state.feedback === 'dislike' ? 'rgba(248,113,113,0.1)' : 'transparent' }}
            title="Dislike"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold mb-1 leading-snug`} style={{ color: 'var(--text-primary)' }}>
          {suggestion.topic}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {suggestion.description}
        </p>
      </div>

      {/* Why */}
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
      >
        <span className="font-medium" style={{ color: 'var(--purple-text)' }}>Why: </span>
        {suggestion.reason}
      </div>

      {/* Actions */}
      {!compact && (
        <div className="flex gap-2 mt-auto" onClick={e => e.stopPropagation()}>
          {/* Ask NEXUS about this (detail modal) */}
          <button
            onClick={handleDetail}
            className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={{ background: hovered ? 'var(--purple-bg-hover)' : 'var(--purple-bg)', color: 'var(--purple-text)' }}
          >
            <MessageCircle className="w-3 h-3" />
            <span>Ask NEXUS</span>
          </button>

          {/* Save */}
          {hasUrl && (
            <button
              onClick={handleSave}
              disabled={state.saving || state.saved}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-60"
              style={{
                background: state.saved ? 'rgba(52,211,153,0.1)' : 'var(--bg-elevated)',
                color: state.saved ? '#34d399' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
              title={state.saved ? 'Saved' : 'Save to Library'}
            >
              {state.saving
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : state.saved
                  ? <CheckCircle className="w-3 h-3" />
                  : <BookmarkPlus className="w-3 h-3" />
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Horizontal scroll row (Because / Recent sections) ────────────────────────
function HorizontalCardRow({
  cards, onAskDetail, onFeedback, onSave,
}: {
  cards: DiscoverSuggestion[]
  onAskDetail: (s: DiscoverSuggestion) => void
  onFeedback: (s: DiscoverSuggestion, action: 'like' | 'dislike') => void
  onSave: (s: DiscoverSuggestion) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {cards.map((s, i) => (
        <div key={i} className="flex-shrink-0 w-60">
          <RecommendationCard
            suggestion={s}
            onAskDetail={onAskDetail}
            onFeedback={onFeedback}
            onSave={onSave}
            compact
          />
        </div>
      ))}
    </div>
  )
}

// ── Discover search bar ───────────────────────────────────────────────────────
function DiscoverSearchBar({ totalSources, onExplore }: {
  totalSources: number
  onExplore: (q: string) => void
}) {
  const [query, setQuery]       = useState('')
  const [focused, setFocused]   = useState(false)
  const [results, setResults]   = useState<DiscoverSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const r = await searchDiscover(query)
      setResults(r)
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const hasResults = results && (results.library_hits.length > 0 || results.tool_hits.length > 0)

  return (
    <div className="relative w-full max-w-xl">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200"
        style={{
          background: 'var(--bg-card)',
          borderColor: focused ? 'rgba(139,92,246,0.5)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.08)' : 'none',
        }}
      >
        {searching
          ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: 'var(--purple-text)' }} />
          : <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
        }
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={`Search ${totalSources > 0 ? 'your library + curated tools' : 'curated tools'}…`}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ color: 'var(--text-dim)', background: 'var(--bg-elevated)' }}
          >
            clear
          </button>
        )}
      </div>

      {focused && query && (
        <div
          className="absolute top-full mt-2 left-0 right-0 rounded-2xl border shadow-xl z-50 overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {!hasResults && !searching && (
            <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {results && results.library_hits.length > 0 && (
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium px-1 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                <Library className="w-3 h-3" />In your library
              </p>
              {results.library_hits.slice(0, 3).map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onExplore(s.title); setQuery('') }}
                >
                  {s.favicon_url
                    ? <img src={s.favicon_url} className="w-4 h-4 rounded flex-shrink-0" alt="" />
                    : <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
                  }
                  <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>{s.title}</span>
                  {s.category && <CategoryPill category={s.category} />}
                </div>
              ))}
            </div>
          )}

          {results && results.tool_hits.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium px-1 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                <Zap className="w-3 h-3" />Curated suggestions
              </p>
              {results.tool_hits.slice(0, 4).map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onExplore(t.search_query); setQuery('') }}
                >
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--purple-text)' }} />
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{t.topic}</span>
                  <CategoryPill category={t.category} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Learning Paths section ────────────────────────────────────────────────────
function LearningPathsSection({
  paths, onAskDetail, onFeedback, onSave,
}: {
  paths: LearningPath[]
  onAskDetail: (s: DiscoverSuggestion) => void
  onFeedback: (s: DiscoverSuggestion, action: 'like' | 'dislike') => void
  onSave: (s: DiscoverSuggestion) => void
}) {
  const [open, setOpen] = useState(0)
  if (!paths.length) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-4 h-4" style={{ color: '#60a5fa' }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Learning Paths</h2>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
          {paths.length} paths
        </span>
      </div>

      <div className="space-y-3">
        {paths.map((path, i) => {
          const isOpen = open === i
          const c = catColors(path.category)
          return (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: isOpen ? c.border : 'var(--border)' }}
            >
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                onClick={() => setOpen(isOpen ? -1 : i)}
                style={{ background: isOpen ? c.bg : 'transparent' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{path.name}</span>
                    <CategoryPill category={path.category} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{path.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{path.tools.length} tools</span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform duration-200"
                    style={{ color: 'var(--text-dim)', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {path.tools.map((tool, j) => (
                      <RecommendationCard
                        key={j}
                        suggestion={tool}
                        onAskDetail={onAskDetail}
                        onFeedback={onFeedback}
                        onSave={onSave}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const router   = useRouter()
  const [data, setData]     = useState<DiscoverResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)
  const [modalItem, setModalItem] = useState<DiscoverSuggestion | null>(null)
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    setError(false)
    const result = await getDiscover()
    if (result) {
      setData(result)
    } else {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleExplore = useCallback((query: string) => {
    try {
      const stored = localStorage.getItem('nexus-recent-queries')
      const queries: string[] = stored ? JSON.parse(stored) : []
      localStorage.setItem('nexus-recent-queries', JSON.stringify([query, ...queries.filter(q => q !== query)].slice(0, 5)))
    } catch {}
    router.push(`/app/ask?q=${encodeURIComponent(query)}`)
  }, [router])

  const handleFeedback = useCallback(async (s: DiscoverSuggestion, action: 'like' | 'dislike') => {
    await sendFeedback(s.topic, s.category, s.tags ?? [], action)
  }, [])

  const handleSave = useCallback(async (s: DiscoverSuggestion): Promise<void> => {
    if (!s.url) return
    try {
      await ingestSource({ url: s.url })
      await sendFeedback(s.topic, s.category, s.tags ?? [], 'save')
      setSavedTopics(prev => new Set([...prev, s.topic]))
    } catch {}
  }, [])

  const handleSavedFromModal = useCallback((topic: string) => {
    setSavedTopics(prev => new Set([...prev, topic]))
  }, [])

  const isStarter = data?.starter_mode ?? (data ? data.total_sources < 2 : false)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
            >
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Discover</h1>
          </div>
          <p className="text-sm pl-0.5" style={{ color: 'var(--text-dim)' }}>
            Personalized recommendations · adapts to what you save and ask
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--purple-bg)' }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--purple-text)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Building your discovery feed…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-20 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <AlertCircle className="w-10 h-10" style={{ color: '#f87171' }} />
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Backend not reachable</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Make sure the NEXUS backend is reachable at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && data && (
        <div className="space-y-10">

          {/* Search bar */}
          <DiscoverSearchBar totalSources={data.total_sources} onExplore={handleExplore} />

          {/* Starter banner */}
          {isStarter && (
            <div
              className="p-5 rounded-2xl border flex items-start gap-4"
              style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--purple-text)' }}>Start building your library</span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                  Save a few sources and Discover will learn your interests and personalize everything for you. Like or dislike cards to tune the recommendations.
                </p>
                <button
                  onClick={() => router.push('/app/add')}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                  <ArrowRight className="w-3 h-3" /> Add your first source
                </button>
              </div>
            </div>
          )}

          {/* Interest profile banner */}
          {!isStarter && (
            <div
              className="p-5 rounded-2xl border flex items-start gap-4"
              style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--purple-text)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--purple-text)' }}>Your library in one sentence</span>
                  <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
                    {data.total_sources} sources
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {data.interest_summary}
                </p>
                {data.top_interests.length > 0 && <InterestCloud interests={data.top_interests} />}
              </div>
            </div>
          )}

          {/* Based on your recent questions */}
          {data.recent_question_sections && data.recent_question_sections.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#fbbf24' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Based on your recent questions</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  Temporary
                </span>
              </div>
              {data.recent_question_sections.map((section, i) => (
                <div key={i} style={{ opacity: 0.4 + section.decay * 0.6 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-medium truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                      &ldquo;{section.query.length > 60 ? section.query.slice(0, 60) + '…' : section.query}&rdquo;
                    </span>
                    <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--text-dimmer)' }}>
                      {section.age_label}
                    </span>
                  </div>
                  <HorizontalCardRow
                    cards={section.recommendations}
                    onAskDetail={setModalItem}
                    onFeedback={handleFeedback}
                    onSave={handleSave}
                  />
                </div>
              ))}
              <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
                This section fades after 72 hours and won&apos;t permanently change your Discover feed.
              </p>
            </div>
          )}

          {/* Recommended For You */}
          {data.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isStarter ? 'Popular Tools to Explore' : 'Recommended For You'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}>
                  {data.suggestions.filter(s => !savedTopics.has(s.topic)).length} picks
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.suggestions
                  .filter(s => !savedTopics.has(s.topic))
                  .map((s, i) => (
                    <RecommendationCard
                      key={i}
                      suggestion={s}
                      onAskDetail={setModalItem}
                      onFeedback={handleFeedback}
                      onSave={handleSave}
                    />
                  ))
                }
              </div>
            </div>
          )}

          {/* Because you saved */}
          {!isStarter && data.because_sections && data.because_sections.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: '#34d399' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Because You Saved…</h2>
              </div>
              {data.because_sections.map((section, i) => {
                const c = catColors(section.anchor_category)
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.text }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Because you saved</span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[200px]"
                        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        {section.anchor_title}
                      </span>
                    </div>
                    <HorizontalCardRow
                      cards={section.recommendations}
                      onAskDetail={setModalItem}
                      onFeedback={handleFeedback}
                      onSave={handleSave}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Learning Paths */}
          {!isStarter && data.learning_paths && data.learning_paths.length > 0 && (
            <LearningPathsSection
              paths={data.learning_paths}
              onAskDetail={setModalItem}
              onFeedback={handleFeedback}
              onSave={handleSave}
            />
          )}

          {/* Two-column: knowledge gaps + trending */}
          {(data.knowledge_gaps.length > 0 || data.trending_in_your_space.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {data.knowledge_gaps.length > 0 && (
                <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4" style={{ color: '#fbbf24' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Knowledge Gaps</h3>
                  </div>
                  <div className="space-y-3">
                    {data.knowledge_gaps.map((gap, i) => (
                      <div
                        key={i}
                        className="flex gap-3 cursor-pointer group"
                        onClick={() => handleExplore(gap.area)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#fbbf24' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium group-hover:underline transition-all" style={{ color: 'var(--text-primary)' }}>
                            {gap.area}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{gap.reason}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.trending_in_your_space.length > 0 && (
                <div className="p-5 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Trending in Your Space</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.trending_in_your_space.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => handleExplore(topic)}
                        className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200"
                        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'
                          e.currentTarget.style.color = '#34d399'
                          e.currentTarget.style.background = 'rgba(52,211,153,0.08)'
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                          e.currentTarget.style.background = 'var(--bg-elevated)'
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-4" style={{ color: 'var(--text-dim)' }}>Click any topic to search your library</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
              Adapts to your saves, likes, and Ask NEXUS queries ·{' '}
              <span className="underline cursor-pointer hover:opacity-70 transition-opacity" onClick={load}>
                Refresh now
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
              Made by <span className="font-medium" style={{ color: 'var(--text-dim)' }}>Devin Hill</span>
            </p>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {modalItem && (
        <DiscoverDetailModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onSaved={handleSavedFromModal}
        />
      )}
    </div>
  )
}
