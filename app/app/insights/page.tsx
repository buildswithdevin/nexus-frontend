'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles, TrendingUp, Lightbulb, BookOpen,
  Plus, Loader2, RefreshCw, Target, Tag,
} from 'lucide-react'
import { getInsights, type InsightsResponse } from '@/lib/api'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{sub}</p>}
    </div>
  )
}

function InsightBullet({ text, icon: Icon, color }: { text: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}1a` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{text}</p>
    </div>
  )
}

function TagBar({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 truncate text-right flex-shrink-0" style={{ color: '#9ca3af' }}>{name}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
        />
      </div>
      <span className="text-xs w-6 text-right flex-shrink-0" style={{ color: '#6b7280' }}>{count}</span>
    </div>
  )
}

export default function InsightsPage() {
  const [data,     setData]     = useState<InsightsResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [reloading, setReloading] = useState(false)

  async function load(reload = false) {
    if (reload) setReloading(true)
    const result = await getInsights()
    setData(result)
    setLoading(false)
    setReloading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#a78bfa' }} />
          <p className="text-sm" style={{ color: '#9ca3af' }}>Generating AI insights…</p>
        </div>
      </div>
    )
  }

  if (!data || data.total_sources === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">AI Insights</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>Patterns and intelligence from your library</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Sparkles className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No insights yet</h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: '#9ca3af' }}>
            Save at least 3 sources to unlock AI-powered insights about your knowledge patterns.
          </p>
          <a
            href="/app/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <Plus className="w-4 h-4" />
            Add Sources
          </a>
        </div>
      </div>
    )
  }

  const topTags      = Object.entries(data.stats.top_tags).sort((a, b) => b[1] - a[1])
  const maxTagCount  = topTags[0]?.[1] ?? 1
  const categories   = Object.entries(data.stats.categories).sort((a, b) => b[1] - a[1])
  const maxCatCount  = categories[0]?.[1] ?? 1

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">AI Insights</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>Patterns and intelligence from your library</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={reloading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sources Saved"  value={data.total_sources}  sub={`${categories.length} categories`} />
        <StatCard label="Collections"    value={data.total_clusters} sub="organized groups" />
        <StatCard label="Unique Tags"    value={Object.keys(data.stats.top_tags).length}  sub="AI-generated" />
        <StatCard label="Top Category"   value={categories[0]?.[0] ?? '—'} sub={`${categories[0]?.[1] ?? 0} sources`} />
      </div>

      {/* Headline */}
      <div
        className="flex items-start gap-4 p-5 rounded-2xl border mb-6"
        style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.15)' }}
      >
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #8b5cf6, #6366f1)' }} />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a78bfa' }}>NEXUS AI</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{data.headline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Insights */}
        {data.insights.length > 0 && (
          <div className="p-5 rounded-2xl border" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4" style={{ color: '#fbbf24' }} />
              <h2 className="text-sm font-semibold text-white">Observations</h2>
            </div>
            <div className="space-y-3">
              {data.insights.map((ins, i) => (
                <InsightBullet key={i} text={ins} icon={Sparkles} color="#a78bfa" />
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {data.trends.length > 0 && (
          <div className="p-5 rounded-2xl border" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: '#34d399' }} />
              <h2 className="text-sm font-semibold text-white">Trends</h2>
            </div>
            <div className="space-y-3">
              {data.trends.map((trend, i) => (
                <InsightBullet key={i} text={trend} icon={TrendingUp} color="#34d399" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Tags chart */}
        {topTags.length > 0 && (
          <div className="p-5 rounded-2xl border" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4" style={{ color: '#818cf8' }} />
              <h2 className="text-sm font-semibold text-white">Top Tags</h2>
            </div>
            <div className="space-y-2.5">
              {topTags.slice(0, 8).map(([tag, count]) => (
                <TagBar key={tag} name={tag} count={count} max={maxTagCount} />
              ))}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categories.length > 0 && (
          <div className="p-5 rounded-2xl border" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: '#60a5fa' }} />
              <h2 className="text-sm font-semibold text-white">Categories</h2>
            </div>
            <div className="space-y-2.5">
              {categories.slice(0, 8).map(([cat, count]) => (
                <TagBar key={cat} name={cat} count={count} max={maxCatCount} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended topics */}
      {data.recommended_topics.length > 0 && (
        <div className="p-5 rounded-2xl border mb-6" style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4" style={{ color: '#f472b6' }} />
            <h2 className="text-sm font-semibold text-white">Recommended to Explore</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.recommended_topics.map(topic => (
              <span
                key={topic}
                className="text-sm px-3 py-1.5 rounded-full border font-medium"
                style={{ background: 'rgba(244,114,182,0.08)', borderColor: 'rgba(244,114,182,0.2)', color: '#f472b6' }}
              >
                {topic}
              </span>
            ))}
          </div>
          <a
            href="/app/add"
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
          >
            <Plus className="w-3 h-3" />
            Find &amp; Save Sources
          </a>
        </div>
      )}

      {/* Learning path */}
      {data.learning_path && (
        <div
          className="p-5 rounded-2xl border"
          style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.15)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: '#818cf8' }} />
            <h2 className="text-sm font-semibold text-white">Suggested Learning Path</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#c4b5fd' }}>{data.learning_path}</p>
        </div>
      )}
    </div>
  )
}
