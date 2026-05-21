export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// ── OAuth helpers ─────────────────────────────────────────────────────────────

export function oauthRedirect(provider: 'google' | 'microsoft' | 'github') {
  window.location.href = `${API_BASE}/api/auth/${provider}`
}

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'nexus-token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  // Also set a cookie for Next.js middleware to read
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  document.cookie = `nexus-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = 'nexus-token=; path=/; max-age=0; SameSite=Lax'
}

// ── Authenticated fetch ───────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init.headers || {}),
    },
  })
}

export interface Source {
  id: string
  title: string
  url: string
  description: string | null
  summary: string | null
  favicon_url: string | null
  category: string
  categories?: string[]
  primary_category?: string
  tags: string[]
  technologies: string[]
  topics: string[]
  notes: string | null
  pinned: boolean
  use_case: string | null
  learning_value: string | null
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed' | null
  enrichment_error: string | null
  enriched_at: string | null
  capture_method: string | null
  content_type: string | null
  importance_score: number | null
  created_at: string
  updated_at: string
  content_excerpt?: string
  _score?: number
}

export interface CollectionAssignment {
  cluster_id: string
  cluster_name: string
  cluster_color: string
  confidence: number
  reason: string
}

export interface IngestResponse {
  status: 'created' | 'duplicate'
  message: string
  site: Source
  collection: CollectionAssignment | null
}

export interface CommandSearchResult {
  command: string
  interpretation: string
  insight: string
  total: number
  results: Source[]
}

export interface AskRecommendation {
  source: Source
  reason: string
  relevance: 'high' | 'medium' | 'low'
}

export interface AskResponse {
  query: string
  answer: string
  recommendations: AskRecommendation[]
  missing_topics: string[]
  total_searched: number
  synthesis_method: 'ai' | 'local' | 'honest-no-match' | 'blocked'
  query_intent?: 'compare' | 'recommend' | 'explain' | 'find' | 'learn' | 'general'
  confidence_summary?: { strong: number; moderate: number; weak: number }
  blocked?: boolean
  blocked_category?: string
}

export interface Cluster {
  id: string
  name: string
  description: string | null
  color: string | null
  site_ids: string[]
  learning_path: string[]
  insight: string | null
  parent_id?: string | null
  icon?: string | null
  created_at: string
  children?: Cluster[]
}

export interface EnrichedCluster extends Cluster {
  source_count: number
  top_tags: string[]
  recent_sources: { id: string; title: string; favicon_url: string | null; url: string }[]
}

export interface InsightsResponse {
  total_sources: number
  total_clusters: number
  headline: string
  insights: string[]
  trends: string[]
  recommended_topics: string[]
  collection_suggestions: { name: string; description: string; reasoning: string }[]
  learning_path: string
  stats: {
    categories: Record<string, number>
    top_tags: Record<string, number>
  }
}

// ── Sites ────────────────────────────────────────────────────────────────────

export async function getSites(params?: { pinned?: boolean; category?: string; limit?: number }): Promise<Source[] | null> {
  try {
    const q = new URLSearchParams({ limit: String(params?.limit ?? 500) })
    if (params?.pinned !== undefined) q.set('pinned', String(params.pinned))
    if (params?.category) q.set('category', params.category)
    const res = await apiFetch(`${API_BASE}/api/sites?${q}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    return data.sites as Source[]
  } catch {
    return null
  }
}

export async function getSite(id: string): Promise<Source | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function updateSite(id: string, updates: Partial<Pick<Source, 'title' | 'description' | 'notes' | 'tags' | 'category' | 'pinned' | 'technologies' | 'topics'>>): Promise<Source | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function deleteSite(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function togglePin(id: string, pinned: boolean): Promise<Source | null> {
  return updateSite(id, { pinned })
}

export interface EnrichmentStatusItem {
  id: string
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed'
  title: string
  category: string | null
  tags: string[]
  summary: string | null
  description: string | null
  enrichment_error: string | null
}

export async function getEnrichmentStatus(ids: string[]): Promise<EnrichmentStatusItem[] | null> {
  if (!ids.length) return []
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/enrichment-status?ids=${ids.join(',')}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.statuses as EnrichmentStatusItem[]
  } catch {
    return null
  }
}

export async function reanalyzeSite(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/${id}/reanalyze`, { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

export interface RelatedSite {
  id: string
  source_id: string
  related_source_id: string
  relationship_type: string
  confidence_score: number
  reason: string | null
  site: Source
}

export async function getRelatedSites(id: string): Promise<RelatedSite[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/${id}/related`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.related as RelatedSite[]
  } catch {
    return null
  }
}

// ── Ingest ────────────────────────────────────────────────────────────────────

export async function ingestSource(payload: {
  url: string
  category?: string
  notes?: string
}): Promise<IngestResponse> {
  const res = await apiFetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to ingest source')
  }
  return res.json()
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchLibrary(query: string): Promise<CommandSearchResult | null> {
  // 1. Semantic search (local embeddings)
  try {
    const res = await apiFetch(`${API_BASE}/api/search/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 10, min_score: 0.1 }),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data.results?.length > 0)
        return { command: query, interpretation: '', insight: '', total: data.total, results: data.results }
    }
  } catch (e) {
    console.warn('[NEXUS search] semantic failed', e)
  }

  // 2. Keyword fallback
  try {
    const res = await apiFetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=10`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return { command: query, interpretation: '', insight: '', total: data.total, results: data.results }
    }
  } catch (e) {
    console.warn('[NEXUS search] keyword fallback failed', e)
  }

  return null
}

export async function askLibrary(query: string): Promise<AskResponse | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/search/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 8 }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Ask failed: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('[NEXUS ask]', e)
    return null
  }
}

// ── Clusters / Collections ────────────────────────────────────────────────────

export async function getClusters(): Promise<Cluster[]> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.clusters as Cluster[]
  } catch {
    return []
  }
}

export async function getEnrichedClusters(): Promise<EnrichedCluster[]> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/enriched`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.clusters as EnrichedCluster[]
  } catch {
    return []
  }
}

export async function addSourceToCluster(clusterId: string, siteId: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/${clusterId}/sources/${siteId}`, { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

export async function removeSourceFromCluster(clusterId: string, siteId: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/${clusterId}/sources/${siteId}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function reassignSourceCollection(siteId: string): Promise<CollectionAssignment | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/reassign-source/${siteId}`, { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json()
    return data.collection
  } catch {
    return null
  }
}

export async function createCluster(payload: { name: string; description?: string; color?: string; site_ids?: string[] }): Promise<Cluster | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function updateCluster(id: string, updates: Partial<{ name: string; description: string; color: string; site_ids: string[] }>): Promise<Cluster | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function deleteCluster(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export interface ClusterSuggestion {
  cluster_id: string
  cluster_name: string
  cluster_color: string | null
  confidence: number
  reason: string
  current: boolean
}

export async function getClusterTree(): Promise<{ total: number; tree: (Cluster & { children?: Cluster[] })[] } | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/tree`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function suggestCollections(siteId: string): Promise<ClusterSuggestion[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/suggest?site_id=${encodeURIComponent(siteId)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.suggestions as ClusterSuggestion[]
  } catch {
    return null
  }
}

export async function autoOrganizeClusters(): Promise<{ clusters: Cluster[]; message: string } | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/clusters/auto-organize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Insights ──────────────────────────────────────────────────────────────────

export async function getInsights(): Promise<InsightsResponse | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/insights`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── System ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ ok: boolean; vectors?: number }> {
  try {
    const res = await apiFetch(`${API_BASE}/health`, { cache: 'no-store' })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    return { ok: data.status === 'ok', vectors: data.chroma_vectors }
  } catch {
    return { ok: false }
  }
}

// ── Discover ──────────────────────────────────────────────────────────────────

export interface DiscoverSuggestion {
  topic: string
  description: string
  reason: string
  category: string
  search_query: string
  url?: string
  tags?: string[]
}

export interface KnowledgeGap {
  area: string
  reason: string
}

export interface BecauseSection {
  anchor_title: string
  anchor_id: string
  anchor_category: string
  recommendations: DiscoverSuggestion[]
}

export interface RecentQuerySection {
  query: string
  age_label: string
  decay: number
  recommendations: DiscoverSuggestion[]
}

export interface LearningPath {
  name: string
  description: string
  category: string
  tools: DiscoverSuggestion[]
}

export interface DiscoverResponse {
  interest_summary: string
  top_interests: string[]
  suggestions: DiscoverSuggestion[]
  knowledge_gaps: KnowledgeGap[]
  trending_in_your_space: string[]
  total_sources: number
  because_sections?: BecauseSection[]
  recent_question_sections?: RecentQuerySection[]
  learning_paths?: LearningPath[]
  starter_mode?: boolean
}

export interface DiscoverSearchResult {
  query: string
  library_hits: Source[]
  tool_hits: DiscoverSuggestion[]
}

export interface UserProfile {
  liked_tags: Record<string, number>
  disliked_tags: Record<string, number>
  liked_categories: Record<string, number>
  disliked_categories: Record<string, number>
  saved_topics: string[]
  dismissed_topics: string[]
  recent_queries: Array<{ query: string; tags: string[]; categories: string[]; timestamp: string }>
  updated_at: string | null
}

export async function getDiscover(): Promise<DiscoverResponse | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/discover`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function searchDiscover(query: string): Promise<DiscoverSearchResult | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/discover/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Profile / feedback ────────────────────────────────────────────────────────

export async function sendFeedback(
  topic: string,
  category: string,
  tags: string[],
  action: 'like' | 'dislike' | 'save' | 'dismiss',
): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE}/api/profile/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, category, tags, action }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function recordQueryIntent(query: string): Promise<void> {
  try {
    await apiFetch(`${API_BASE}/api/profile/query-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
  } catch {
    // fire-and-forget, never throw
  }
}

// ── Compare ───────────────────────────────────────────────────────────────────

export interface CompareSubject {
  name: string
  tagline: string
  strengths: string[]
  weaknesses: string[]
  best_for: string
}

export interface CompareResponse {
  query: string
  subject_a: CompareSubject
  subject_b: CompareSubject
  summary: string
  verdict: string
  when_to_choose_a: string
  when_to_choose_b: string
  source_ids_a: string[]
  source_ids_b: string[]
}

export async function compareQuery(query: string): Promise<CompareResponse | null> {
  try {
    const res = await apiFetch(`${API_BASE}/search/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function clearAllSources(): Promise<{ deleted: number; message: string } | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/sites/clear-all`, { method: 'POST' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function exportLibrary(): Promise<Blob | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/export`)
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:           string
  username:     string
  email:        string
  display_name: string
  created_at:   string
}

export interface AuthResponse {
  token:      string
  token_type: string
  user:       AuthUser
}

function diagnoseNetworkError(err: unknown, endpoint: string): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('load failed')) {
    console.error(`[NEXUS] Network/CORS error calling ${endpoint}. API_BASE="${API_BASE}"`)
    return new Error('Cannot reach the NEXUS server. This is usually a CORS or connectivity issue — check the browser console for details.')
  }
  return err instanceof Error ? err : new Error(msg)
}

export async function authSignup(payload: {
  display_name: string
  username:     string
  email:        string
  password:     string
}): Promise<AuthResponse> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch (err) {
    throw diagnoseNetworkError(err, '/api/auth/signup')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Signup failed' }))
    throw new Error(err.detail || 'Signup failed')
  }
  return res.json()
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
  } catch (err) {
    throw diagnoseNetworkError(err, '/api/auth/login')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function authGetMe(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/auth/me`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function authUpdateMe(updates: {
  display_name?: string
  username?:     string
  email?:        string
}): Promise<{ token: string; user: AuthUser } | null> {
  try {
    const res = await apiFetch(`${API_BASE}/api/auth/me`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Update failed' }))
      throw new Error(err.detail || 'Update failed')
    }
    return res.json()
  } catch (e) {
    throw e
  }
}
