'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Link2, CheckCircle, AlertCircle, Loader2, Sparkles,
  Tag, ArrowRight, ClipboardPaste, X, Plus, Globe, FolderOpen,
} from 'lucide-react'
import { ingestSource, type Source, type CollectionAssignment } from '@/lib/api'

const URL_REGEX = /https?:\/\/[^\s<>"'`)\]},;]+/g

function extractUrls(text: string): string[] {
  const raw = text.match(URL_REGEX) ?? []
  const cleaned = raw.map(u => u.replace(/[.,;:!?)]+$/, '').trim())
  return [...new Set(cleaned)].filter(u => {
    try { new URL(u); return true } catch { return false }
  })
}

type JobStatus = 'pending' | 'processing' | 'done' | 'duplicate' | 'error'

interface Job {
  id: string
  url: string
  status: JobStatus
  result?: Source
  collection?: CollectionAssignment | null
  error?: string
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Queued',     color: '#9ca3af', bg: 'rgba(107,114,128,0.1)' },
  processing: { label: 'Analyzing', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)'  },
  done:       { label: 'Saved',     color: '#34d399', bg: 'rgba(16,185,129,0.1)'  },
  duplicate:  { label: 'Already saved', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
  error:      { label: 'Failed',    color: '#f87171', bg: 'rgba(239,68,68,0.1)'   },
}

export default function AddSourcePage() {
  const [pasteText,   setPasteText]   = useState('')
  const [detectedUrls, setDetectedUrls] = useState<string[]>([])
  const [jobs,         setJobs]         = useState<Job[]>([])
  const [running,      setRunning]      = useState(false)
  const [manualUrl,    setManualUrl]    = useState('')
  const [dragging,     setDragging]     = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const handlePasteChange = useCallback((text: string) => {
    setPasteText(text)
    setDetectedUrls(extractUrls(text))
  }, [])

  function removeUrl(url: string) {
    setDetectedUrls(prev => prev.filter(u => u !== url))
  }

  function addManualUrl() {
    const u = manualUrl.trim()
    if (!u) return
    try {
      new URL(u)
      setDetectedUrls(prev => [...new Set([...prev, u])])
      setManualUrl('')
    } catch {
      // invalid URL — ignore
    }
  }

  async function processAll() {
    if (detectedUrls.length === 0) return
    setRunning(true)

    const newJobs: Job[] = detectedUrls.map(url => ({
      id:     url,
      url,
      status: 'pending' as JobStatus,
    }))
    setJobs(newJobs)
    setDetectedUrls([])
    setPasteText('')

    for (const job of newJobs) {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j))
      try {
        const data = await ingestSource({ url: job.url })
        setJobs(prev => prev.map(j =>
          j.id === job.id
            ? { ...j, status: data.status === 'duplicate' ? 'duplicate' : 'done', result: data.site, collection: data.collection }
            : j
        ))
      } catch (err) {
        setJobs(prev => prev.map(j =>
          j.id === job.id
            ? { ...j, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
            : j
        ))
      }
    }
    setRunning(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const text = e.dataTransfer.getData('text')
    if (text) handlePasteChange(text)
  }

  const doneCount  = jobs.filter(j => j.status === 'done').length
  const errorCount = jobs.filter(j => j.status === 'error').length
  const allDone    = jobs.length > 0 && jobs.every(j => j.status !== 'pending' && j.status !== 'processing')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Add Sources</h1>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Paste one URL, ten URLs, or messy text containing links — NEXUS figures it out.
        </p>
      </div>

      {/* Main paste area */}
      {jobs.length === 0 && (
        <div className="space-y-4 mb-6">
          {/* Drop zone / Paste area */}
          <div
            className="relative rounded-2xl border-2 border-dashed transition-all duration-200 p-1"
            style={{
              borderColor: dragging ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              background:  dragging ? 'rgba(139,92,246,0.05)' : '#0f0f24',
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="p-1">
              <textarea
                ref={textRef}
                value={pasteText}
                onChange={e => handlePasteChange(e.target.value)}
                onPaste={e => {
                  const text = e.clipboardData.getData('text')
                  handlePasteChange(text)
                }}
                placeholder={`Paste anything here:\n\nhttps://example.com\n\nOr messy text like:\n"Check out https://openai.com and also https://anthropic.com for AI tools"\n\nOr a full list of links…`}
                rows={8}
                className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none leading-relaxed px-4 py-3"
              />
            </div>

            {/* Drag hint overlay */}
            {dragging && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none">
                <div className="text-center">
                  <ClipboardPaste className="w-8 h-8 mx-auto mb-2" style={{ color: '#a78bfa' }} />
                  <p className="text-sm font-medium" style={{ color: '#a78bfa' }}>Drop text here</p>
                </div>
              </div>
            )}
          </div>

          {/* Detected URLs */}
          {detectedUrls.length > 0 && (
            <div
              className="p-4 rounded-2xl border"
              style={{ background: '#0a0a18', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#8b5cf6', color: '#fff' }}
                  >
                    {detectedUrls.length}
                  </div>
                  <p className="text-sm font-medium text-white">
                    URL{detectedUrls.length !== 1 ? 's' : ''} detected
                  </p>
                </div>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Click × to remove any you don't want
                </p>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {detectedUrls.map(url => (
                  <div
                    key={url}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6b7280' }} />
                    <span className="flex-1 text-xs truncate" style={{ color: '#d1d5db' }}>{url}</span>
                    <button
                      onClick={() => removeUrl(url)}
                      className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3 h-3" style={{ color: '#9ca3af' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual URL add */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 focus-within:border-violet-500/40"
            style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: '#6b7280' }} />
            <input
              type="url"
              placeholder="Or type a single URL: https://..."
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualUrl() } }}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            {manualUrl && (
              <button
                onClick={addManualUrl}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" style={{ color: '#a78bfa' }} />
              </button>
            )}
          </div>

          {/* Process button */}
          {detectedUrls.length > 0 && (
            <button
              onClick={processAll}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              <Sparkles className="w-4 h-4" />
              Analyze &amp; Save {detectedUrls.length} URL{detectedUrls.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Job progress */}
      {jobs.length > 0 && (
        <div
          className="p-5 rounded-2xl border mb-6"
          style={{ background: '#0f0f24', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#a78bfa' }} />
              ) : allDone ? (
                <CheckCircle className="w-4 h-4" style={{ color: '#34d399' }} />
              ) : null}
              <h2 className="text-sm font-semibold text-white">
                {running
                  ? `Processing ${jobs.filter(j => j.status !== 'pending').length} / ${jobs.length}…`
                  : `Completed — ${doneCount} saved${errorCount > 0 ? `, ${errorCount} failed` : ''}`}
              </h2>
            </div>
            {allDone && (
              <button
                onClick={() => { setJobs([]); setPasteText(''); setDetectedUrls([]) }}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: '#a78bfa' }}
              >
                Add More
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(jobs.filter(j => j.status !== 'pending' && j.status !== 'processing').length / jobs.length) * 100}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              }}
            />
          </div>

          {/* Job list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jobs.map(job => {
              const cfg = STATUS_CONFIG[job.status]
              return (
                <div
                  key={job.id}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-200"
                  style={{ background: '#06060f', borderColor: 'rgba(255,255,255,0.04)' }}
                >
                  {/* Status dot */}
                  <div className="mt-0.5 flex-shrink-0">
                    {job.status === 'processing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#a78bfa' }} />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: cfg.color, boxShadow: job.status === 'done' ? '0 0 6px rgba(52,211,153,0.4)' : 'none' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {job.result ? (
                      <>
                        <p className="text-xs font-medium text-white truncate mb-0.5">{job.result.title}</p>
                        <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                          {new URL(job.url).hostname}
                        </p>
                        {job.result.tags && job.result.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Tag className="w-2.5 h-2.5" style={{ color: '#6b7280' }} />
                            {job.result.tags.slice(0, 4).map(t => (
                              <span key={t} className="text-xs" style={{ color: '#9ca3af' }}>{t}</span>
                            ))}
                          </div>
                        )}
                        {job.collection && (
                          <div
                            className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full w-fit"
                            style={{ background: `${job.collection.cluster_color}18`, border: `1px solid ${job.collection.cluster_color}40` }}
                            title={job.collection.reason}
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: job.collection.cluster_color }} />
                            <FolderOpen className="w-2.5 h-2.5 flex-shrink-0" style={{ color: job.collection.cluster_color }} />
                            <span className="text-xs font-medium" style={{ color: job.collection.cluster_color }}>
                              {job.collection.cluster_name}
                            </span>
                            <span className="text-xs" style={{ color: '#6b7280' }}>
                              {Math.round(job.collection.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs truncate" style={{ color: job.status === 'error' ? '#f87171' : '#9ca3af' }}>
                        {job.status === 'error' ? (job.error || 'Failed') : job.url}
                      </p>
                    )}
                  </div>

                  <span
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Done CTA */}
          {allDone && doneCount > 0 && (
            <a
              href="/app/library"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              View Library <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {/* Tips */}
      <div
        className="p-5 rounded-2xl border"
        style={{ background: '#0a0a18', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
          What NEXUS accepts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['Single URL', 'https://openai.com'],
            ['Multiple URLs', '10+ links at once'],
            ['Messy text', 'Paragraphs with embedded links'],
            ['Chat exports', 'Copied Slack / Discord messages'],
            ['Notes / docs', 'Any text containing links'],
            ['Any web page', 'Articles, tools, papers, repos'],
          ].map(([label, example]) => (
            <div key={label} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#8b5cf6' }} />
              <div>
                <span className="text-xs font-medium text-white">{label}</span>
                <span className="text-xs ml-1" style={{ color: '#6b7280' }}>{example}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
