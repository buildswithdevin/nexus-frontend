'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Send, Sparkles, BookOpen, ExternalLink, Loader2,
  Search, Cpu, AlertCircle, ChevronRight, Scale,
  CheckCircle, XCircle, ArrowRight, Shield, Heart,
} from 'lucide-react'
import { askLibrary, compareQuery, recordQueryIntent, type AskResponse, type AskRecommendation, type CompareResponse } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  askData?: AskResponse
  compareData?: CompareResponse
  error?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────
const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! Ask me anything — I'll search your saved library and explain what's relevant and why. You can also compare two tools: **React vs Vue**, **Cursor vs Copilot**, etc.",
}

const EXAMPLE_QUERIES = [
  'What AI tools have I saved?',
  'What resources cover frontend development?',
  'Compare React vs Vue',
  'Which sources relate to machine learning?',
]

const COMPARISON_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bcompare\b.+\band\b/i,
  /\bcompare\b.+\bwith\b/i,
  /\bwhich is better\b/i,
  /\bdifference between\b/i,
]

function isComparisonQuery(q: string): boolean {
  return COMPARISON_PATTERNS.some(p => p.test(q))
}

function saveRecentQuery(query: string) {
  try {
    const stored = localStorage.getItem('nexus-recent-queries')
    const queries: string[] = stored ? JSON.parse(stored) : []
    const updated = [query, ...queries.filter(q => q !== query)].slice(0, 5)
    localStorage.setItem('nexus-recent-queries', JSON.stringify(updated))
  } catch {}
}

// ── Helper components ─────────────────────────────────────────────────────────

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function relevanceBadge(rel: AskRecommendation['relevance']) {
  const map = {
    high:   { label: 'Strong match', bg: 'rgba(139,92,246,0.2)',  text: '#a78bfa' },
    medium: { label: 'Good match',   bg: 'rgba(99,102,241,0.15)', text: '#818cf8' },
    low:    { label: 'Weak match',   bg: 'rgba(107,114,128,0.15)',text: 'var(--text-muted)' },
  }
  return map[rel] ?? map.low
}

function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return null
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="pl-3 py-1 text-xs leading-relaxed italic"
              style={{ borderLeft: '2px solid rgba(139,92,246,0.5)', color: '#c4b5fd' }}>
              {line.slice(2)}
            </blockquote>
          )
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        )
      })}
    </div>
  )
}

// ── Safety Card ───────────────────────────────────────────────────────────────

function SafetyCard({ category, message }: { category?: string; message: string }) {
  const isSelfHarm = category === 'self_harm'

  if (isSelfHarm) {
    return (
      <div
        className="p-4 rounded-xl border"
        style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
      >
        <div className="flex items-start gap-3">
          <Heart className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#fbbf24' }} />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
              Here when you need support
            </p>
            <MarkdownText text={message} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} />
        <MarkdownText text={message} />
      </div>
    </div>
  )
}

// ── Comparison Card ───────────────────────────────────────────────────────────

function ComparisonCard({ data }: { data: CompareResponse }) {
  const { subject_a, subject_b, summary, verdict, when_to_choose_a, when_to_choose_b } = data
  if (!subject_a || !subject_b) return null

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{summary}</p>
      )}

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {[subject_a, subject_b].map((subj, idx) => (
          <div key={idx} className="p-4 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{subj.name}</p>
            {subj.tagline && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{subj.tagline}</p>
            )}

            {subj.strengths?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#34d399' }}>Strengths</p>
                <ul className="space-y-1">
                  {subj.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {subj.weaknesses?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#f87171' }}>Weaknesses</p>
                <ul className="space-y-1">
                  {subj.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {subj.best_for && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Best for: </span>
                  {subj.best_for}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Verdict */}
      {verdict && (
        <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
          <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#a78bfa' }}>Verdict</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{verdict}</p>
          </div>
        </div>
      )}

      {/* When to choose */}
      {(when_to_choose_a || when_to_choose_b) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: `Choose ${subject_a.name}`, text: when_to_choose_a, color: '#60a5fa' },
            { label: `Choose ${subject_b.name}`, text: when_to_choose_b, color: '#a78bfa' },
          ].map((item, i) => item.text ? (
            <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: item.color }}>{item.label} when…</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.text}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

// ── Recommendation Card ───────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: AskRecommendation }) {
  const { source, reason, relevance } = rec
  const badge = relevanceBadge(relevance)
  const domain = getDomain(source.url)
  const blurb = source.summary || source.content_excerpt || source.description || ''

  return (
    <div
      className="p-4 rounded-xl border transition-all duration-200 group"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: badge.bg, color: badge.text }}>
              {badge.label}
            </span>
            {source.category && source.category !== 'Other' && (
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{source.category}</span>
            )}
          </div>
          <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{source.title}</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{domain}</p>
        </div>
        <a href={source.url} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {reason && (
        <div className="flex items-start gap-2 mb-2 mt-2">
          <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#c4b5fd' }}>{reason}</p>
        </div>
      )}

      {blurb && (
        <p className="text-xs leading-relaxed line-clamp-2 mt-2" style={{ color: 'var(--text-muted)' }}>{blurb}</p>
      )}

      {source.tags && source.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {source.tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Assistant Message ─────────────────────────────────────────────────────────

function AssistantMessage({ msg }: { msg: Message }) {
  const { askData, compareData } = msg
  const isBlocked       = askData?.blocked === true
  const isHonestNoMatch = askData?.synthesis_method === 'honest-no-match'
  const hasRecs = askData && askData.recommendations.length > 0
  const cs = askData?.confidence_summary

  // Safety block — show calm card, nothing else
  if (isBlocked) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--purple-bg)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
        </div>
        <div className="flex-1 max-w-2xl">
          <SafetyCard category={askData?.blocked_category} message={msg.content} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--purple-bg)' }}>
        {compareData ? <Scale className="w-4 h-4" style={{ color: 'var(--purple-text)' }} /> : <Sparkles className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />}
      </div>

      <div className="flex-1 max-w-2xl">
        {/* Answer */}
        {msg.content && (
          <div className="mb-4">
            <MarkdownText text={msg.content} />
          </div>
        )}

        {/* Comparison card */}
        {compareData && <ComparisonCard data={compareData} />}

        {/* Honest no-match banner */}
        {isHonestNoMatch && (
          <div className="flex items-start gap-3 p-4 rounded-xl border mb-4"
            style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <Search className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <div className="flex-1">
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#fbbf24' }}>No strong matches in your library</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Import relevant sources to get accurate answers on this topic.
              </p>
              <a href="/app/add"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                Import a source <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {hasRecs && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                {isHonestNoMatch ? 'Loosely related' : 'From your library'}
              </span>
              {cs && !isHonestNoMatch && (cs.strong > 0 || cs.moderate > 0) && (
                <span className="text-xs ml-auto flex items-center gap-1.5">
                  {cs.strong > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                      {cs.strong} strong
                    </span>
                  )}
                  {cs.moderate > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      {cs.moderate} moderate
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {askData.recommendations.map(rec => <RecommendationCard key={rec.source.id} rec={rec} />)}
            </div>
          </div>
        )}

        {/* Missing topics (suppress on honest-no-match — the banner already handles it) */}
        {askData && askData.missing_topics.length > 0 && !isHonestNoMatch && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#fbbf24' }}>Consider saving more about:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {askData.missing_topics.map(t => (
                  <a key={t} href="/app/add" className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all duration-200"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                    {t} <ChevronRight className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state (no recs, no honest-no-match, not an error) */}
        {askData && !compareData && askData.recommendations.length === 0 && !msg.error && !isHonestNoMatch && (
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No matching sources found.{' '}
              <a href="/app/add" className="underline" style={{ color: 'var(--purple-text)' }}>Add more content</a>{' '}
              to build your library.
            </p>
          </div>
        )}

        {/* Footer meta */}
        {askData && !compareData && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {askData.query_intent && askData.query_intent !== 'general' && (
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple-text)' }}>
                {askData.query_intent}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Search className="w-3 h-3" style={{ color: 'var(--text-dimmer)' }} />
              <span className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
                Searched {askData.total_searched} vector{askData.total_searched !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" style={{ color: 'var(--text-dimmer)' }} />
              <span className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
                {askData.synthesis_method === 'ai' ? 'Claude AI synthesis' : isHonestNoMatch ? 'No strong matches' : 'Semantic ranking'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inner page (uses useSearchParams) ────────────────────────────────────────

function AskPageInner() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const autoFired = useRef(false)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Auto-submit ?q= param once
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !autoFired.current) {
      autoFired.current = true
      setInput(q)
      setTimeout(() => handleSend(q), 100)
    }
  }, [searchParams])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(queryOverride?: string) {
    const query = (queryOverride ?? input).trim()
    if (!query || loading) return
    setInput('')
    saveRecentQuery(query)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: query }])
    setLoading(true)

    try {
      // ── Comparison branch ────────────────────────────────────────────────
      if (isComparisonQuery(query)) {
        const cmp = await compareQuery(query)
        if (cmp) {
          const header = `Comparing **${cmp.subject_a?.name ?? 'A'}** vs **${cmp.subject_b?.name ?? 'B'}**`
          setMessages(prev => [...prev, {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: header,
            compareData: cmp,
          }])
          return
        }
        // Fall through to normal ask if compare fails
      }

      // ── Normal ask branch ────────────────────────────────────────────────
      const data = await askLibrary(query)
      if (!data) {
        setMessages(prev => [...prev, {
          id: `e-${Date.now()}`, role: 'assistant',
          content: 'Could not connect to the backend. Make sure NEXUS is running on port 8000.',
          error: true,
        }])
        return
      }

      const answerText = data.answer ||
        (data.recommendations.length === 0
          ? "I couldn't find relevant sources for that query. Try saving more content first."
          : `Found ${data.recommendations.length} relevant source${data.recommendations.length > 1 ? 's' : ''}.`)

      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: answerText, askData: data }])
      // Fire-and-forget: update Discover's "Based on your recent questions"
      recordQueryIntent(query)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const showExamples = messages.length === 1

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--purple-bg)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ask Your Library</h1>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Semantic search + AI synthesis · Compare any two tools with <span style={{ color: 'var(--purple-text)' }}>X vs Y</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-lg px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <AssistantMessage msg={msg} />
            )}
          </div>
        ))}

        {showExamples && (
          <div className="pl-11">
            <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all duration-200 text-left"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--purple-bg)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
            </div>
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--purple-text)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching and synthesizing…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-end gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-within:border-violet-500/50"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything, or compare: React vs Vue…"
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed"
            style={{ maxHeight: '120px', color: 'var(--text-primary)' }}
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dimmer)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────
export default function AskPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--purple-text)' }} />
      </div>
    }>
      <AskPageInner />
    </Suspense>
  )
}
