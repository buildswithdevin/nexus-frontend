'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User, Server, Sliders, Database, CheckCircle, XCircle,
  Download, Trash2, Moon, Sun, Monitor, Edit3, Save, X,
  Image as ImageIcon, LogIn, LogOut, UserPlus, Check,
} from 'lucide-react'
import { checkHealth, clearAllSources, exportLibrary } from '@/lib/api'
import { useTheme, BACKGROUND_OPTIONS, type ThemeMode, type BackgroundPreset } from '@/lib/theme-context'
import { useUser } from '@/lib/user-context'

// ── Shared card wrapper ──────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-2xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--purple-bg)' }}>
          <Icon className="w-4 h-4" style={{ color: 'var(--purple-text)' }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{children}</label>
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
      style={{
        background: 'var(--input-bg)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      }}
      onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
  )
}

// ── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, updateProfile } = useUser()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.displayName)
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(user.displayName)
    setUsername(user.username)
    setEmail(user.email)
  }, [user])

  const save = () => {
    if (!name.trim()) return
    updateProfile({ displayName: name.trim(), username: username.trim(), email: email.trim() })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const cancel = () => {
    setName(user.displayName)
    setUsername(user.username)
    setEmail(user.email)
    setEditing(false)
  }

  return (
    <Section icon={User} title="Profile">
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
        >
          {user.avatarInitial}
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <Label>Display Name</Label>
            <Input value={name} onChange={setName} placeholder="Your name" />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={setUsername} placeholder="username" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }}
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Username</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.username || '—'}</p>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Email</p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--purple-bg-hover)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--purple-bg)')}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#34d399' }}>
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}

// ── Account Section ──────────────────────────────────────────────────────────
function AccountSection() {
  const { user, isLoggedIn, login, logout } = useUser()
  const [mode, setMode] = useState<'view' | 'login' | 'signup'>('view')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = () => {
    if (!email.trim()) { setError('Email is required'); return }
    login(email.split('@')[0] || 'User', email.trim())
    setSuccess('Signed in successfully.')
    setMode('view')
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSignup = () => {
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    login(name.trim(), email.trim())
    setSuccess('Account created! Welcome to NEXUS.')
    setMode('view')
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleLogout = () => {
    logout()
    setSuccess('Signed out.')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <Section icon={LogIn} title="Account">
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
          <Check className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {isLoggedIn ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              {user.avatarInitial}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Local account · NEXUS</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>Active</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      ) : mode === 'view' ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in or create a local account to personalize NEXUS and keep your library private.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </p>
          {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>{error}</p>}
          {mode === 'signup' && (
            <div>
              <Label>Display Name</Label>
              <Input value={name} onChange={setName} placeholder="Your name" />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          </div>
          <div>
            <Label>Password</Label>
            <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Your data stays local on this device — no server required.
          </p>
          <div className="flex gap-2">
            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }}
            >
              {mode === 'login' ? <><LogIn className="w-3.5 h-3.5" /> Sign In</> : <><UserPlus className="w-3.5 h-3.5" /> Create</>}
            </button>
            <button
              onClick={() => { setMode('view'); setError('') }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

// ── Appearance Section ────────────────────────────────────────────────────────
function AppearanceSection() {
  const { theme, background, backgroundOverlay, setTheme, setBackground, setBackgroundOverlay } = useTheme()

  const themeOptions: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
    { id: 'dark',   label: 'Dark',   icon: Moon },
    { id: 'light',  label: 'Light',  icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <Section icon={Sliders} title="Appearance">
      {/* Theme */}
      <div className="mb-6">
        <Label>Theme</Label>
        <div className="flex gap-2">
          {themeOptions.map(opt => {
            const active = theme === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 flex-1 justify-center"
                style={{
                  background: active ? 'var(--purple-bg-hover)' : 'var(--bg-elevated)',
                  borderColor: active ? 'rgba(139,92,246,0.5)' : 'var(--border)',
                  color: active ? 'var(--purple-text)' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 16px rgba(139,92,246,0.15)' : 'none',
                }}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Background */}
      <div>
        <Label>Background</Label>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_OPTIONS.map(opt => {
            const active = background === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setBackground(opt.id)}
                className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200"
                style={{
                  borderColor: active ? 'rgba(139,92,246,0.6)' : 'var(--border)',
                  background: active ? 'var(--purple-bg)' : 'var(--bg-elevated)',
                }}
              >
                {/* Preview swatch */}
                <div
                  className="w-full h-10 rounded-lg"
                  style={{ background: opt.preview }}
                />
                <span className="text-xs font-medium text-center leading-tight" style={{ color: active ? 'var(--purple-text)' : 'var(--text-muted)' }}>
                  {opt.label}
                </span>
                {active && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#8b5cf6' }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {background !== 'none' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <Label>Overlay Opacity</Label>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(backgroundOverlay * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={backgroundOverlay}
              onChange={e => setBackgroundOverlay(parseFloat(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>
              <span>Vivid</span>
              <span>Subtle</span>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Backend Connection ─────────────────────────────────────────────────────────
function BackendSection() {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [vectors, setVectors] = useState<number | undefined>()

  const recheck = () => {
    setBackendStatus('loading')
    checkHealth().then(r => {
      setBackendStatus(r.ok ? 'connected' : 'disconnected')
      setVectors(r.vectors)
    })
  }

  useEffect(() => { recheck() }, [])

  return (
    <Section icon={Server} title="Backend Connection">
      <div className="flex items-center justify-between p-4 rounded-xl border mb-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>API Endpoint</p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
          {vectors !== undefined && backendStatus === 'connected' && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{vectors} vectors indexed</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {backendStatus === 'loading' ? (
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#fbbf24' }} />
          ) : backendStatus === 'connected' ? (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
              <CheckCircle className="w-4 h-4" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#34d399' }}>Connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
              <XCircle className="w-4 h-4" style={{ color: '#f87171' }} />
              <span className="text-sm" style={{ color: '#f87171' }}>Disconnected</span>
            </>
          )}
        </div>
      </div>
      {backendStatus === 'disconnected' && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Make sure the NEXUS backend is running at{' '}
          <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--purple-text)' }}>
            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </code>
        </p>
      )}
      <button
        onClick={recheck}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
        onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
      >
        Re-check Connection
      </button>
    </Section>
  )
}

// ── Data Management ───────────────────────────────────────────────────────────
function DataSection() {
  const [showDangerConfirm, setShowDangerConfirm] = useState(false)
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [clearState, setClearState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [clearCount, setClearCount] = useState(0)

  const handleExport = async () => {
    setExportState('loading')
    const blob = await exportLibrary()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexus-library-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportState('done')
      setTimeout(() => setExportState('idle'), 3000)
    } else {
      setExportState('error')
      setTimeout(() => setExportState('idle'), 3000)
    }
  }

  const handleClearAll = async () => {
    setClearState('loading')
    setShowDangerConfirm(false)
    const result = await clearAllSources()
    if (result) {
      setClearCount(result.deleted)
      setClearState('done')
      setTimeout(() => setClearState('idle'), 4000)
    } else {
      setClearState('error')
      setTimeout(() => setClearState('idle'), 3000)
    }
  }

  return (
    <Section icon={Database} title="Data Management">
      {/* Export */}
      <div className="p-4 rounded-xl border mb-3" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>Export Library</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Download all sources as JSON</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60"
            style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }}
          >
            {exportState === 'loading' ? (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : exportState === 'done' ? (
              <><Check className="w-4 h-4" /> Exported</>
            ) : exportState === 'error' ? (
              <><XCircle className="w-4 h-4" style={{ color: '#f87171' }} /> Failed</>
            ) : (
              <><Download className="w-4 h-4" /> Export</>
            )}
          </button>
        </div>
      </div>

      {/* Clear All */}
      <div className="p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: '#f87171' }}>Clear All Sources</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Permanently delete all saved sources and embeddings</p>
            {clearState === 'done' && (
              <p className="text-xs mt-1" style={{ color: '#34d399' }}>Removed {clearCount} source{clearCount !== 1 ? 's' : ''}.</p>
            )}
            {clearState === 'error' && (
              <p className="text-xs mt-1" style={{ color: '#f87171' }}>Failed — is the backend running?</p>
            )}
          </div>
          {clearState === 'loading' ? (
            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : showDangerConfirm ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDangerConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                Yes, Delete All
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDangerConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Manage your NEXUS account, appearance, and data</p>
      </div>

      <div className="space-y-5">
        <ProfileSection />
        <AccountSection />
        <AppearanceSection />
        <BackendSection />
        <DataSection />
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>NEXUS v1.0.0 · AI-Powered Knowledge Hub</p>
      </div>
    </div>
  )
}
