'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ExternalLink, BookmarkPlus, Search, Tag, Folder,
  Loader2, CheckCircle, ArrowRight, Sparkles,
} from 'lucide-react'
import { ingestSource, sendFeedback, type DiscoverSuggestion } from '@/lib/api'

interface Props {
  item: DiscoverSuggestion | null
  onClose: () => void
  onSaved?: (topic: string) => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'AI & ML':            { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'AI Tools':           { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'Development':        { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Robotics':           { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Embedded Systems':   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Hardware':           { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  'Data Science':       { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Cloud & DevOps':     { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  'Cybersecurity':      { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Research':           { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Productivity':       { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  'Design':             { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
}

function catColors(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'var(--purple-bg)', text: 'var(--purple-text)', border: 'rgba(139,92,246,0.25)' }
}

// Use-case copy derived from category
const CATEGORY_USE_CASES: Record<string, string[]> = {
  'AI & ML':        ['Automate repetitive tasks', 'Enhance research workflows', 'Build AI-powered apps'],
  'AI Tools':       ['Accelerate coding', 'Generate and summarize content', 'Build LLM pipelines'],
  'Development':    ['Accelerate development', 'Improve code quality', 'Build production-ready apps'],
  'Robotics':       ['Control hardware systems', 'Process sensor data', 'Simulate robots'],
  'Embedded Systems':['Write firmware', 'Connect IoT devices', 'Run ML on microcontrollers'],
  'Data Science':   ['Analyze datasets', 'Build ML pipelines', 'Visualize insights'],
  'Cloud & DevOps': ['Automate deployments', 'Monitor infrastructure', 'Scale services'],
  'Cybersecurity':  ['Test application security', 'Detect vulnerabilities', 'Analyze network traffic'],
  'Productivity':   ['Organize knowledge', 'Automate workflows', 'Manage projects'],
  'Design':         ['Prototype UI flows', 'Create visual assets', 'Collaborate on design'],
  'Research':       ['Organize papers', 'Build literature reviews', 'Structure knowledge'],
}

export default function DiscoverDetailModal({ item, onClose, onSaved }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!item) return null

  const colors = catColors(item.category)
  const useCases = CATEGORY_USE_CASES[item.category] ?? []
  const hasUrl = Boolean(item.url)

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasUrl || saving || saved) return
    setSaving(true)
    setSaveError(false)
    try {
      await ingestSource({ url: item.url! })
      await sendFeedback(item.topic, item.category, item.tags ?? [], 'save')
      setSaved(true)
      onSaved?.(item.topic)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const handleAsk = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/app/ask?q=${encodeURIComponent(item.search_query)}`)
    onClose()
  }

  const handleOpenSite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-lg rounded-3xl border flex flex-col overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 pb-4 flex items-start gap-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {item.topic.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              {item.topic}
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {item.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-xl transition-colors"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>

          {/* Description */}
          <div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {item.description}
            </p>
          </div>

          {/* Why recommended */}
          <div
            className="flex gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--purple-text)' }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--purple-text)' }}>Why NEXUS recommends this</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
            </div>
          </div>

          {/* Use cases */}
          {useCases.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <ArrowRight className="w-3.5 h-3.5" /> Use cases
              </p>
              <ul className="space-y-1.5">
                {useCases.map((uc, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: colors.text }} />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Tag className="w-3.5 h-3.5" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.slice(0, 10).map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-4 flex flex-col gap-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Save to Library */}
          {hasUrl && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                background: saved
                  ? 'rgba(52,211,153,0.15)'
                  : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: saved ? '#34d399' : '#fff',
              }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : saved
                  ? <><CheckCircle className="w-4 h-4" /> Saved to Library</>
                  : <><BookmarkPlus className="w-4 h-4" /> Save to Library</>
              }
            </button>
          )}
          {saveError && (
            <p className="text-xs text-center" style={{ color: '#f87171' }}>
              Could not save — check the backend is running.
            </p>
          )}

          {/* Ask NEXUS about this */}
          <button
            onClick={handleAsk}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--purple-bg)')}
          >
            <Search className="w-4 h-4" /> Ask NEXUS about this
          </button>

          {/* Open official website */}
          {hasUrl && (
            <button
              onClick={handleOpenSite}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <ExternalLink className="w-4 h-4" /> Open Official Website
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
