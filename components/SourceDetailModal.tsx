'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ExternalLink, MessageCircle, Tag, Folder,
  Loader2, ChevronRight, Edit3, Check, FileText,
} from 'lucide-react'
import {
  updateSite, getClusters, type Source, type Cluster, API_BASE,
} from '@/lib/api'

interface Props {
  source: Source
  onClose: () => void
  onUpdate?: (updated: Source) => void
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'AI & ML':         { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  'Development':     { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  'Cybersecurity':   { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Robotics':        { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  'Embedded Systems':{ bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Productivity':    { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  'Design':          { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  'Research':        { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Data Science':    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Cloud & DevOps':  { bg: 'rgba(14,165,233,0.12)',  text: '#38bdf8', border: 'rgba(14,165,233,0.25)' },
  'Hardware':        { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
}
function catColors(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'var(--purple-bg)', text: 'var(--purple-text)', border: 'rgba(139,92,246,0.25)' }
}

export default function SourceDetailModal({ source, onClose, onUpdate }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState<Source>(source)

  // Related sources
  const [related, setRelated] = useState<Source[]>([])
  const [relatedLoading, setRelatedLoading] = useState(true)

  // Collection membership
  const [collections, setCollections] = useState<Cluster[]>([])

  // Inline note editing
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(source.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Load related sources + collections in parallel
  useEffect(() => {
    let cancelled = false

    async function fetchRelated() {
      setRelatedLoading(true)
      try {
        const query = [current.title, ...(current.tags ?? []).slice(0, 3)].join(' ')
        const res = await fetch(`${API_BASE}/api/search/semantic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 6, min_score: 0.15 }),
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        const hits = (data.results as Source[]).filter(r => r.id !== current.id).slice(0, 4)
        if (!cancelled) setRelated(hits)
      } catch {
        // silence — related sources are best-effort
      } finally {
        if (!cancelled) setRelatedLoading(false)
      }
    }

    async function fetchCollections() {
      const all = await getClusters()
      if (!cancelled) {
        setCollections(all.filter(c => (c.site_ids ?? []).includes(current.id)))
      }
    }

    fetchRelated()
    fetchCollections()
    return () => { cancelled = true }
  }, [current.id, current.title, current.tags])

  async function saveNotes() {
    setSavingNotes(true)
    const updated = await updateSite(current.id, { notes: notesDraft })
    setSavingNotes(false)
    if (updated) {
      setCurrent(updated)
      onUpdate?.(updated)
    }
    setEditingNotes(false)
  }

  const colors = catColors(current.category)
  const domain = getDomain(current.url)
  const favicon = current.favicon_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  const summary = current.summary || current.description || ''
  const techs = current.technologies ?? []
  const topics = current.topics ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border flex flex-col overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={favicon} alt="" width={20} height={20} onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
              ;(e.target as HTMLImageElement).parentElement!.textContent = current.title[0] ?? '?'
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold leading-snug mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {current.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--text-dim)' }}>{domain}</span>
              {current.category && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {current.category}
                </span>
              )}
            </div>
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="px-6 py-5 space-y-5">

            {/* Summary */}
            {summary && (
              <div>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Summary</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{summary}</p>
              </div>
            )}

            {/* Tags + Technologies + Topics */}
            {(current.tags?.length || techs.length || topics.length) ? (
              <div className="space-y-2.5">
                {current.tags && current.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                      <Tag className="w-3 h-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {current.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {techs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Technologies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {techs.map(t => (
                        <span key={t} className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {topics.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map(t => (
                        <span key={t} className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(20,184,166,0.1)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                  <Folder className="w-3 h-3" /> In collections
                </p>
                <div className="flex flex-wrap gap-2">
                  {collections.map(c => (
                    <span
                      key={c.id}
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: `${c.color}18`, color: c.color ?? 'var(--purple-text)', border: `1px solid ${c.color}30` }}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                  <FileText className="w-3 h-3" /> Notes
                </p>
                {!editingNotes && (
                  <button
                    onClick={() => { setNotesDraft(current.notes ?? ''); setEditingNotes(true) }}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder="Add your thoughts, context, or reminders…"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: 'rgba(139,92,246,0.4)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }}
                    >
                      {savingNotes
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                        : <><Check className="w-3 h-3" /> Save</>
                      }
                    </button>
                  </div>
                </div>
              ) : current.notes ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{current.notes}</p>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--text-dimmer)' }}>No notes yet — click Edit to add some.</p>
              )}
            </div>

            {/* Related sources */}
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                Related in your library
              </p>
              {relatedLoading ? (
                <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-dimmer)' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Finding related sources…</span>
                </div>
              ) : related.length > 0 ? (
                <div className="space-y-2">
                  {related.map(r => {
                    const rColors = catColors(r.category)
                    return (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 group no-underline"
                        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--border-hover)'
                          e.currentTarget.style.background = 'var(--bg-card)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)'
                          e.currentTarget.style.background = 'var(--bg-elevated)'
                        }}
                      >
                        <div>
                          <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{getDomain(r.url)}</span>
                            {r.category && (
                              <span className="text-xs px-1.5 py-0 rounded-full" style={{ background: rColors.bg, color: rColors.text }}>
                                {r.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>No related sources found in your library yet.</p>
              )}
            </div>

          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="px-5 py-4 flex gap-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 no-underline"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </a>
          <button
            onClick={() => {
              router.push(`/app/ask?q=${encodeURIComponent(current.title)}`)
              onClose()
            }}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--purple-bg)')}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Ask NEXUS
          </button>
        </div>
      </div>
    </div>
  )
}
