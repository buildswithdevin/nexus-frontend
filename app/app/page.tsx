'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Layers, Sparkles, MessageSquare, ArrowRight, TrendingUp, Plus } from 'lucide-react'
import SourceCard from '@/components/SourceCard'
import { getSites, type Source } from '@/lib/api'
import { useUser } from '@/lib/user-context'
import { Compass, RotateCcw, AlertCircle } from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getUniqueCategories(sources: Source[]): string[] {
  return [...new Set(sources.map((s) => s.category).filter(Boolean))]
}

export default function DashboardPage() {
  const { user } = useUser()
  const [sources, setSources] = useState<Source[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [recentQueries, setRecentQueries] = useState<string[]>([])

  const loadSites = () => {
    setLoaded(false)
    setError(false)
    getSites().then((data) => {
      if (data !== null) {
        setSources(data)
      } else {
        setError(true)
      }
      setLoaded(true)
    })
  }

  useEffect(() => {
    loadSites()
    try {
      const stored = localStorage.getItem('nexus-recent-queries')
      if (stored) setRecentQueries(JSON.parse(stored))
    } catch {}
  }, [])

  const recentSources = sources.slice(0, 3)
  const categories = getUniqueCategories(sources)
  const pinnedCount = sources.filter((s) => s.pinned).length
  const tagSet = new Set(sources.flatMap((s) => s.tags || []))

  const stats = [
    {
      label: 'Sources Saved',
      value: loaded ? String(sources.length) : '—',
      icon: BookOpen,
      iconColor: '#a78bfa',
      iconBg: 'rgba(139,92,246,0.12)',
      change: loaded ? `${sources.length} total` : 'Loading…',
    },
    {
      label: 'Categories',
      value: loaded ? String(categories.length) : '—',
      icon: Layers,
      iconColor: '#818cf8',
      iconBg: 'rgba(99,102,241,0.12)',
      change: categories.slice(0, 2).join(', ') || 'None yet',
    },
    {
      label: 'Unique Tags',
      value: loaded ? String(tagSet.size) : '—',
      icon: Sparkles,
      iconColor: '#c084fc',
      iconBg: 'rgba(168,85,247,0.12)',
      change: '100% AI-generated',
    },
    {
      label: 'Pinned Sources',
      value: loaded ? String(pinnedCount) : '—',
      icon: MessageSquare,
      iconColor: '#34d399',
      iconBg: 'rgba(16,185,129,0.12)',
      change: pinnedCount > 0 ? 'Pinned & prioritized' : 'None pinned yet',
    },
  ]

  const suggestedCollections = categories.slice(0, 3).map((cat) => ({
    label: cat,
    count: sources.filter((s) => s.category === cat).length,
    color: '#a78bfa',
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, {user.displayName}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{formatDate()}</p>
        </div>
        <Link
          href="/app/add"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <Plus className="w-4 h-4" />
          Add Source
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
          style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: '#f87171' }}>Backend not reachable</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Could not connect to {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
            </p>
          </div>
          <button
            onClick={loadSites}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border transition-all duration-200"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: stat.iconBg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-xs truncate" style={{ color: '#34d399' }}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recently Saved */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recently Saved</h2>
          <Link
            href="/app/library"
            className="flex items-center gap-1 text-sm transition-colors duration-200 hover:text-white"
            style={{ color: '#a78bfa' }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onUpdate={(updated) => setSources(prev => prev.map(s => s.id === updated.id ? updated : s))}
                onDelete={(id) => setSources(prev => prev.filter(s => s.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>AI Insights</h2>
        <div
          className="flex items-start gap-4 p-5 rounded-2xl border"
          style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.15)' }}
        >
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>NEXUS AI</span>
            </div>
            {loaded && sources.length > 0 ? (
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                You have <strong style={{ color: 'var(--text-primary)' }}>{sources.length} sources</strong> saved across{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{categories.length} categories</strong> with{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{tagSet.size} unique tags</strong>.{' '}
                {sources.length >= 3
                  ? 'Try asking a question across your library in Ask NEXUS.'
                  : 'Add a few more sources, then use Ask NEXUS to query across them.'}
              </p>
            ) : (
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                Start by adding sources to your library. Once you have a few saved, NEXUS will surface patterns and insights here.
              </p>
            )}
            <Link
              href="/app/ask"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
            >
              Ask NEXUS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Continue Researching */}
      {recentQueries.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Continue Researching</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentQueries.map((q, i) => (
              <Link
                key={i}
                href={`/app/ask?q=${encodeURIComponent(q)}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
                <span className="truncate max-w-xs">{q}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover nudge */}
      <div className="mb-8">
        <div
          className="flex items-center justify-between p-4 rounded-2xl border"
          style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--purple-bg)' }}>
              <Compass className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Discover what to explore next</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI recommendations based on your library interests</p>
            </div>
          </div>
          <Link
            href="/app/discover"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}
          >
            Discover <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Suggested Collections */}
      {suggestedCollections.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {suggestedCollections.map((col) => (
              <Link
                key={col.label}
                href="/app/library"
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{col.label}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  {col.count}
                </span>
              </Link>
            ))}
            <Link
              href="/app/library"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
