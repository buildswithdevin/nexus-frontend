'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Edit2, Trash2, Pin, PinOff, X, Save, Loader2, Tag, Info, FolderPlus, Sparkles } from 'lucide-react'
import {
  updateSite, deleteSite, togglePin, reanalyzeSite,
  getEnrichedClusters, suggestCollections, addSourceToCluster, removeSourceFromCluster,
  type Source, type EnrichedCluster, type ClusterSuggestion,
} from '@/lib/api'
import SourceDetailModal from './SourceDetailModal'

interface SourceCardProps {
  source: Source
  onDelete?: (id: string) => void
  onUpdate?: (updated: Source) => void
  compact?: boolean
}

const CATEGORIES = ['AI & ML', 'Cybersecurity', 'Robotics', 'Embedded Systems', 'Productivity', 'Development', 'Design', 'Research', 'Data Science', 'Cloud & DevOps', 'Hardware', 'Other', 'Article', 'Documentation', 'Course', 'Tool', 'Video', 'Note']

const categoryColors: Record<string, { bg: string; text: string }> = {
  'AI & ML':         { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa' },
  'Development':     { bg: 'rgba(99,102,241,0.15)',   text: '#818cf8' },
  'Cybersecurity':   { bg: 'rgba(239,68,68,0.15)',    text: '#f87171' },
  'Robotics':        { bg: 'rgba(16,185,129,0.15)',   text: '#34d399' },
  'Embedded Systems':{ bg: 'rgba(245,158,11,0.15)',   text: '#fbbf24' },
  'Productivity':    { bg: 'rgba(20,184,166,0.15)',   text: '#2dd4bf' },
  'Design':          { bg: 'rgba(236,72,153,0.15)',   text: '#f472b6' },
  'Research':        { bg: 'rgba(168,85,247,0.15)',   text: '#c084fc' },
  'Data Science':    { bg: 'rgba(59,130,246,0.15)',   text: '#60a5fa' },
  'Cloud & DevOps':  { bg: 'rgba(14,165,233,0.15)',   text: '#38bdf8' },
  'Hardware':        { bg: 'rgba(249,115,22,0.15)',   text: '#fb923c' },
  'Article':         { bg: 'rgba(99,102,241,0.15)',   text: '#818cf8' },
  'Course':          { bg: 'rgba(139,92,246,0.15)',   text: '#a78bfa' },
  'Documentation':   { bg: 'rgba(16,185,129,0.15)',   text: '#34d399' },
  'Tool':            { bg: 'rgba(245,158,11,0.15)',   text: '#fbbf24' },
  'Video':           { bg: 'rgba(239,68,68,0.15)',    text: '#f87171' },
  'Note':            { bg: 'rgba(59,130,246,0.15)',   text: '#60a5fa' },
  'Other':           { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}

function getFavicon(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
  } catch { return '' }
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ source, onClose, onSave }: {
  source: Source
  onClose: () => void
  onSave: (updated: Source) => void
}) {
  const [title,       setTitle]       = useState(source.title)
  const [description, setDescription] = useState(source.description || '')
  const [notes,       setNotes]       = useState(source.notes || '')
  const [tagsStr,     setTagsStr]     = useState((source.tags || []).join(', '))
  const [category,    setCategory]    = useState(source.category || 'Other')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const updated = await updateSite(source.id, { title, description, notes, tags, category })
    setSaving(false)
    if (updated) onSave(updated)
    else setError('Failed to save. Is the backend running?')
  }

  function stopBubble(e: React.MouseEvent) { e.stopPropagation() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--purple-border)' }}
        onClick={stopBubble}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Source</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', appearance: 'none' }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Tag className="w-3 h-3" />
              Tags <span style={{ color: 'var(--text-dim)' }}>(comma-separated)</span>
            </label>
            <input
              value={tagsStr}
              onChange={e => setTagsStr(e.target.value)}
              placeholder="ai, machine learning, python..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Personal notes about this source..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add to Collection Modal ───────────────────────────────────────────────────

function AddToCollectionModal({ source, onClose }: {
  source: Source
  onClose: () => void
}) {
  const [clusters,     setClusters]     = useState<EnrichedCluster[]>([])
  const [suggestions,  setSuggestions]  = useState<ClusterSuggestion[] | null>(null)
  const [assigned,     setAssigned]     = useState<Set<string>>(new Set())
  const [saving,       setSaving]       = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([getEnrichedClusters(), suggestCollections(source.id)])
      setClusters(c)
      setSuggestions(s)
      setAssigned(new Set(c.filter(cl => (cl.site_ids || []).includes(source.id)).map(cl => cl.id)))
      setLoading(false)
    }
    load()
  }, [source.id])

  async function toggle(clusterId: string) {
    setSaving(clusterId)
    const isIn = assigned.has(clusterId)
    if (isIn) {
      await removeSourceFromCluster(clusterId, source.id)
      setAssigned(prev => { const next = new Set(prev); next.delete(clusterId); return next })
    } else {
      await addSourceToCluster(clusterId, source.id)
      setAssigned(prev => new Set([...prev, clusterId]))
    }
    setSaving(null)
  }

  const suggestedIds   = new Set((suggestions || []).map(s => s.cluster_id))
  const otherClusters  = clusters.filter(c => !suggestedIds.has(c.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--purple-border)', maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Add to Collection</h2>
            <p className="text-xs mt-0.5 truncate max-w-[280px]" style={{ color: 'var(--text-muted)' }}>{source.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8b5cf6' }} />
            </div>
          ) : clusters.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No collections yet.</p>
              <a href="/app/collections" className="block text-xs mt-1" style={{ color: '#8b5cf6' }}>Create one →</a>
            </div>
          ) : (
            <>
              {/* Suggested */}
              {suggestions && suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium px-1 mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                    Suggested
                  </p>
                  <div className="space-y-1.5">
                    {suggestions.map(sug => {
                      const cluster = clusters.find(c => c.id === sug.cluster_id)
                      if (!cluster) return null
                      const isIn  = assigned.has(sug.cluster_id)
                      const color = cluster.color || '#8b5cf6'
                      return (
                        <div
                          key={sug.cluster_id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors"
                          style={{ background: isIn ? `${color}12` : 'var(--bg-elevated)', borderColor: isIn ? `${color}30` : 'var(--border)' }}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{cluster.name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                              {sug.current ? 'Already assigned' : sug.reason}
                            </p>
                          </div>
                          <button
                            onClick={() => toggle(sug.cluster_id)}
                            disabled={saving === sug.cluster_id}
                            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={isIn
                              ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                              : { background: `${color}20`, color }
                            }
                          >
                            {saving === sug.cluster_id ? '…' : isIn ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All other collections */}
              {otherClusters.length > 0 && (
                <div>
                  {suggestions && suggestions.length > 0 && (
                    <p className="text-xs font-medium px-1 mb-1.5 mt-3" style={{ color: 'var(--text-dim)' }}>All Collections</p>
                  )}
                  <div className="space-y-1.5">
                    {otherClusters.map(cluster => {
                      const isIn  = assigned.has(cluster.id)
                      const color = cluster.color || '#8b5cf6'
                      return (
                        <div
                          key={cluster.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors"
                          style={{ background: isIn ? `${color}12` : 'var(--bg-elevated)', borderColor: isIn ? `${color}30` : 'var(--border)' }}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{cluster.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                              {cluster.source_count} source{cluster.source_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => toggle(cluster.id)}
                            disabled={saving === cluster.id}
                            className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={isIn
                              ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                              : { background: `${color}20`, color }
                            }
                          >
                            {saving === cluster.id ? '…' : isIn ? 'Remove' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <a href="/app/collections" className="text-xs hover:opacity-80 transition-opacity" style={{ color: '#8b5cf6' }}>
            Manage collections →
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function SourceCard({ source, onDelete, onUpdate }: SourceCardProps) {
  const [editing,           setEditing]           = useState(false)
  const [details,           setDetails]           = useState(false)
  const [deleting,          setDeleting]          = useState(false)
  const [pinning,           setPinning]           = useState(false)
  const [addingToCollection, setAddingToCollection] = useState(false)
  const [current,           setCurrent]           = useState<Source>(source)

  const colors  = categoryColors[current.category] || categoryColors['Other']
  const domain  = getDomain(current.url)
  const favicon = current.favicon_url || getFavicon(current.url)
  const summary = current.summary || current.description || ''

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm(`Delete "${current.title}"?`)) return
    setDeleting(true)
    const ok = await deleteSite(current.id)
    setDeleting(false)
    if (ok) onDelete?.(current.id)
  }

  async function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setPinning(true)
    const updated = await togglePin(current.id, !current.pinned)
    setPinning(false)
    if (updated) { setCurrent(updated); onUpdate?.(updated) }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setEditing(true)
  }

  function handleSaved(updated: Source) {
    setCurrent(updated)
    onUpdate?.(updated)
    setEditing(false)
  }

  async function handleReanalyze(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setCurrent(prev => ({ ...prev, enrichment_status: 'pending' as const }))
    await reanalyzeSite(current.id)
  }

  const enrichmentStatus = current.enrichment_status ?? null
  const isAnalyzing = enrichmentStatus === 'pending' || enrichmentStatus === 'processing'
  const analysisFailed = enrichmentStatus === 'failed'

  return (
    <>
      {editing && (
        <EditModal source={current} onClose={() => setEditing(false)} onSave={handleSaved} />
      )}
      {details && (
        <SourceDetailModal source={current} onClose={() => setDetails(false)} onUpdate={s => { setCurrent(s); onUpdate?.(s) }} />
      )}
      {addingToCollection && (
        <AddToCollectionModal source={current} onClose={() => setAddingToCollection(false)} />
      )}

      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block p-5 rounded-2xl border transition-all duration-200 cursor-pointer no-underline relative"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.boxShadow   = '0 0 30px rgba(139,92,246,0.12)'
          e.currentTarget.style.transform   = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.boxShadow   = 'none'
          e.currentTarget.style.transform   = 'translateY(0)'
        }}
      >
        {/* Pinned indicator */}
        {current.pinned && (
          <div
            className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
            style={{ background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.6)' }}
          />
        )}

        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                width={16}
                height={16}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span className="text-xs font-bold text-gray-400">{current.title[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate leading-tight mb-1 group-hover:text-violet-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {current.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{domain}</span>
              {current.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {current.category}
                </span>
              )}
            </div>
          </div>
          <ExternalLink
            className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: '#9ca3af' }}
          />
        </div>

        {/* Summary */}
        {summary ? (
          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {summary}
          </p>
        ) : isAnalyzing ? (
          <div className="mb-3 space-y-1.5">
            <div className="h-2.5 rounded-full animate-pulse" style={{ background: 'var(--bg-elevated)', width: '100%' }} />
            <div className="h-2.5 rounded-full animate-pulse" style={{ background: 'var(--bg-elevated)', width: '80%' }} />
          </div>
        ) : analysisFailed ? (
          <p className="text-xs mb-3" style={{ color: 'var(--text-dimmer)' }}>
            Analysis unavailable
          </p>
        ) : null}

        {/* Tags */}
        {current.tags && current.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {current.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {tag}
              </span>
            ))}
            {current.tags.length > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}>
                +{current.tags.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {formatDate(current.created_at)}
            </span>
            {enrichmentStatus === 'processing' && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#7c5bd0' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#8b5cf6' }} />
                analyzing
              </span>
            )}
            {enrichmentStatus === 'pending' && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmer)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4b5563' }} />
                queued
              </span>
            )}
            {analysisFailed && (
              <button
                onClick={handleReanalyze}
                className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                style={{ color: '#d97706' }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#fbbf24' }} />
                retry
              </button>
            )}
          </div>
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={e => e.preventDefault()}
          >
            <button
              onClick={handlePin}
              disabled={pinning}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              title={current.pinned ? 'Unpin' : 'Pin'}
            >
              {current.pinned
                ? <PinOff className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                : <Pin    className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
              }
            </button>
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); setDetails(true) }}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              title="View Details"
            >
              <Info className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); e.preventDefault(); setAddingToCollection(true) }}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              title="Add to Collection"
            >
              <FolderPlus className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
            </button>
            <button
              onClick={handleEdit}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: deleting ? '#6b7280' : '#9ca3af' }} />
            </button>
          </div>
        </div>
      </a>
    </>
  )
}
