'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Sparkles, Loader2, Trash2, BookOpen, Layers,
  Wand2, X, ChevronRight, Info, ArrowRight, Tag,
} from 'lucide-react'
import {
  getEnrichedClusters, createCluster, updateCluster,
  deleteCluster, autoOrganizeClusters, getSites,
  addSourceToCluster, removeSourceFromCluster,
  type EnrichedCluster, type Source,
} from '@/lib/api'

const PALETTE = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
]

// ── Assign Sources Modal ──────────────────────────────────────────────────────

function AssignSourcesModal({
  cluster, allSources, onClose, onUpdate,
}: {
  cluster: EnrichedCluster
  allSources: Source[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [search,  setSearch]  = useState('')
  const [saving,  setSaving]  = useState<string | null>(null)
  const assigned = new Set(cluster.site_ids)

  const filtered = allSources.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  async function toggle(siteId: string, currently: boolean) {
    setSaving(siteId)
    if (currently) {
      await removeSourceFromCluster(cluster.id, siteId)
    } else {
      await addSourceToCluster(cluster.id, siteId)
    }
    setSaving(null)
    onUpdate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border flex flex-col"
        style={{ background: '#0f0f24', borderColor: 'rgba(139,92,246,0.3)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-sm font-semibold text-white">Manage Sources</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{cluster.name} · {cluster.source_count} assigned</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
        </div>

        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sources…"
            className="w-full px-3 py-2 rounded-xl border text-sm text-white bg-transparent outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#06060f' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.map(source => {
            const isIn = assigned.has(source.id)
            return (
              <div
                key={source.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200"
                style={{ background: isIn ? 'rgba(139,92,246,0.08)' : '#06060f', borderColor: isIn ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{source.title}</p>
                  <p className="text-xs truncate" style={{ color: '#6b7280' }}>{source.category}</p>
                </div>
                <button
                  onClick={() => toggle(source.id, isIn)}
                  disabled={saving === source.id}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                  style={isIn
                    ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                    : { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }
                  }
                >
                  {saving === source.id ? '…' : isIn ? 'Remove' : 'Add'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

function ClusterFormModal({
  initial, onClose, onSave,
}: {
  initial?: EnrichedCluster
  onClose: () => void
  onSave: (name: string, desc: string, color: string) => Promise<void>
}) {
  const [name,   setName]   = useState(initial?.name || '')
  const [desc,   setDesc]   = useState(initial?.description || '')
  const [color,  setColor]  = useState(initial?.color || PALETTE[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), desc.trim(), color)
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ background: '#0f0f24', borderColor: 'rgba(139,92,246,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">{initial ? 'Edit Collection' : 'New Collection'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. AI Tools, React Frontend, ESP32 Projects…"
              className="w-full px-3 py-2.5 rounded-xl border text-sm text-white outline-none"
              style={{ background: '#06060f', borderColor: 'rgba(255,255,255,0.1)' }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9ca3af' }}>Description <span style={{ color: '#6b7280' }}>(optional)</span></label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border text-sm text-white outline-none resize-none"
              style={{ background: '#06060f', borderColor: 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#9ca3af' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 12px ${c}80` : 'none',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {initial ? 'Save Changes' : 'Create Collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Enriched Cluster Card ─────────────────────────────────────────────────────

function ClusterCard({
  cluster, allSources, onDelete, onEdit, onRefresh,
}: {
  cluster: EnrichedCluster
  allSources: Source[]
  onDelete: (id: string) => void
  onEdit: (c: EnrichedCluster) => void
  onRefresh: () => void
}) {
  const [deleting,    setDeleting]    = useState(false)
  const [managingOpen, setManagingOpen] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const color = cluster.color || '#8b5cf6'

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${cluster.name}"?`)) return
    setDeleting(true)
    await deleteCluster(cluster.id)
    onDelete(cluster.id)
  }

  return (
    <>
      {managingOpen && (
        <AssignSourcesModal
          cluster={cluster}
          allSources={allSources}
          onClose={() => setManagingOpen(false)}
          onUpdate={onRefresh}
        />
      )}

      <div
        className="flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden group"
        style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.06)' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${color}50`
          e.currentTarget.style.boxShadow   = `0 0 30px ${color}18`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        {/* Color stripe */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

        <div className="p-5 flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}22`, boxShadow: `0 0 12px ${color}22` }}
            >
              <Layers className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white leading-tight mb-0.5 truncate">{cluster.name}</h2>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                {cluster.source_count} source{cluster.source_count !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {cluster.insight && (
                <button
                  onClick={() => setShowInsight(s => !s)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Why this collection?"
                >
                  <Info className="w-3.5 h-3.5" style={{ color: showInsight ? color : '#9ca3af' }} />
                </button>
              )}
              <button
                onClick={() => onEdit(cluster)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Edit"
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
              </button>
            </div>
          </div>

          {/* Description */}
          {cluster.description && (
            <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#9ca3af' }}>
              {cluster.description}
            </p>
          )}

          {/* Why this collection (insight) */}
          {showInsight && cluster.insight && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl mb-3"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
              <p className="text-xs leading-relaxed" style={{ color: '#c4b5fd' }}>{cluster.insight}</p>
            </div>
          )}

          {/* Top tags */}
          {cluster.top_tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <Tag className="w-3 h-3 flex-shrink-0" style={{ color: '#6b7280' }} />
              {cluster.top_tags.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Recent sources */}
          {cluster.recent_sources.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {cluster.recent_sources.map(src => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/5 group/src"
                >
                  {src.favicon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src.favicon_url}
                      alt=""
                      width={12}
                      height={12}
                      className="rounded flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: `${color}40` }} />
                  )}
                  <span className="text-xs truncate group-hover/src:text-white transition-colors" style={{ color: '#9ca3af' }}>
                    {src.title}
                  </span>
                  <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover/src:opacity-60 transition-opacity" style={{ color: '#9ca3af' }} />
                </a>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setManagingOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ background: `${color}20`, color }}
            >
              <Plus className="w-3 h-3" />
              Manage sources
            </button>
            <a
              href={`/app/library`}
              className="flex items-center gap-1 text-xs transition-colors hover:text-white"
              style={{ color: '#6b7280' }}
            >
              Browse all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionsPage() {
  const [clusters,    setClusters]    = useState<EnrichedCluster[]>([])
  const [allSources,  setAllSources]  = useState<Source[]>([])
  const [loading,     setLoading]     = useState(true)
  const [organizing,  setOrganizing]  = useState(false)
  const [organizeMsg, setOrganizeMsg] = useState('')
  const [editingCluster, setEditingCluster] = useState<EnrichedCluster | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)

  async function loadData() {
    const [c, s] = await Promise.all([getEnrichedClusters(), getSites()])
    setClusters(c)
    setAllSources(s || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleAutoOrganize() {
    setOrganizing(true)
    setOrganizeMsg('')
    const result = await autoOrganizeClusters()
    setOrganizing(false)
    if (result) {
      setOrganizeMsg(result.message)
      setTimeout(() => setOrganizeMsg(''), 6000)
      await loadData()
    }
  }

  function handleDelete(id: string) {
    setClusters(prev => prev.filter(c => c.id !== id))
  }

  async function handleCreate(name: string, desc: string, color: string) {
    await createCluster({ name, description: desc, color })
    await loadData()
  }

  async function handleEdit(cluster: EnrichedCluster, name: string, desc: string, color: string) {
    await updateCluster(cluster.id, { name, description: desc, color })
    await loadData()
  }

  const totalAssigned  = clusters.reduce((n, c) => n + c.source_count, 0)
  const totalUnassigned = allSources.filter(
    s => !clusters.some(c => c.site_ids?.includes(s.id))
  ).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Modals */}
      {showCreate && (
        <ClusterFormModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
      {editingCluster && (
        <ClusterFormModal
          initial={editingCluster}
          onClose={() => setEditingCluster(null)}
          onSave={(name, desc, color) => handleEdit(editingCluster, name, desc, color)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Collections</h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            {clusters.length} collection{clusters.length !== 1 ? 's' : ''}
            {totalUnassigned > 0 && <span style={{ color: '#fbbf24' }}> · {totalUnassigned} unassigned</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoOrganize}
            disabled={organizing || allSources.length < 2}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            {organizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Auto-organize Library
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {/* Auto-organize message */}
      {organizeMsg && (
        <div
          className="mb-5 flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
          <p className="text-sm" style={{ color: '#c4b5fd' }}>{organizeMsg}</p>
        </div>
      )}

      {/* Auto-organize explainer (only when there are clusters) */}
      {!loading && clusters.length > 0 && (
        <div
          className="mb-5 flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <Wand2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
            New sources are automatically assigned to the most relevant collection on save.
            Click <strong className="text-white">Auto-organize Library</strong> to rebuild everything from scratch using keyword and category matching — no AI credits needed.
            Use <strong className="text-white">Manage sources</strong> on any card to manually adjust assignments.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: '#0f0f24' }} />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Layers className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No collections yet</h3>
          <p className="text-sm mb-2 max-w-sm" style={{ color: '#9ca3af' }}>
            {allSources.length >= 2
              ? 'Click "Auto-organize Library" to instantly group your sources into named collections — no AI credits needed.'
              : 'Add at least 2 sources first, then use Auto-organize Library.'}
          </p>
          {allSources.length >= 2 && (
            <p className="text-xs mb-6 max-w-sm" style={{ color: '#6b7280' }}>
              Collections like "AI Tools", "Robotics & Hardware", "Frontend Development" are detected automatically from your sources' titles, tags, and categories.
            </p>
          )}
          <div className="flex gap-3">
            {allSources.length >= 2 ? (
              <button
                onClick={handleAutoOrganize}
                disabled={organizing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {organizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Auto-organize Library
              </button>
            ) : (
              <a
                href="/app/add"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                <Plus className="w-4 h-4" />
                Add Sources
              </a>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
            >
              <Plus className="w-4 h-4" />
              Create Manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Collections grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {clusters.map(cluster => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                allSources={allSources}
                onDelete={handleDelete}
                onEdit={setEditingCluster}
                onRefresh={loadData}
              />
            ))}

            {/* Add new */}
            <button
              onClick={() => setShowCreate(true)}
              className="p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[200px]"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(139,92,246,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <Plus className="w-6 h-6" style={{ color: '#a78bfa' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-1">New Collection</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Group related sources together</p>
              </div>
            </button>
          </div>

          {/* Stats bar */}
          <div className="p-5 rounded-2xl border" style={{ background: '#0a0a18', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)' }}>
                <BookOpen className="w-4 h-4" style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="text-sm font-medium text-white">Library Overview</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Collections', value: clusters.length },
                { label: 'Total Sources', value: allSources.length },
                { label: 'Assigned', value: totalAssigned },
                { label: 'Unassigned', value: totalUnassigned },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-xl font-bold text-white mb-0.5" style={stat.label === 'Unassigned' && stat.value > 0 ? { color: '#fbbf24' } : {}}>{stat.value}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
