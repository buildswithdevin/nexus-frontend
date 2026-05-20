'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookOpen, FolderOpen, Plus, MessageSquare,
  Settings, Sparkles, Star, Tag, Clock, Compass,
} from 'lucide-react'
import { useUser } from '@/lib/user-context'

const mainNav = [
  { icon: Home,          label: 'Home',        href: '/app' },
  { icon: BookOpen,      label: 'Library',     href: '/app/library' },
  { icon: FolderOpen,    label: 'Collections', href: '/app/collections' },
  { icon: Plus,          label: 'Add Source',  href: '/app/add' },
]

const aiNav = [
  { icon: MessageSquare, label: 'Ask NEXUS',   href: '/app/ask' },
  { icon: Compass,       label: 'Discover',    href: '/app/discover' },
  { icon: Sparkles,      label: 'AI Insights', href: '/app/insights' },
]

const quickNav = [
  { icon: Star,          label: 'Favorites',   href: '/app/favorites' },
  { icon: Clock,         label: 'Recent',      href: '/app/recent' },
  { icon: Tag,           label: 'Tags',        href: '/app/tags' },
]

function NavItem({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  const pathname  = usePathname()
  const isActive  = href === '/app' ? pathname === '/app' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={isActive
        ? { background: 'var(--purple-bg-hover)', color: 'var(--text-primary)', boxShadow: '0 0 20px rgba(139,92,246,0.12)' }
        : { color: 'var(--text-muted)' }
      }
    >
      <Icon
        className="w-4 h-4 flex-shrink-0 transition-colors"
        style={{ color: isActive ? 'var(--purple-text)' : undefined }}
      />
      {label}
      {isActive && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.8)' }}
        />
      )}
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider"
      style={{ color: 'var(--text-dimmer)', letterSpacing: '0.06em' }}
    >
      {children}
    </p>
  )
}

export default function Sidebar() {
  const { user } = useUser()

  return (
    <aside
      className="hidden md:flex flex-col h-full flex-shrink-0"
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-0.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>NEXUS</span>
        </div>
        <p className="text-xs pl-0.5 mt-0.5" style={{ color: 'var(--text-dim)' }}>AI Knowledge Hub</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNav.map(item => <NavItem key={item.href} {...item} />)}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--border)' }} />

        <div className="space-y-0.5">
          <SectionLabel>Intelligence</SectionLabel>
          {aiNav.map(item => <NavItem key={item.href} {...item} />)}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--border)' }} />

        <div className="space-y-0.5">
          <SectionLabel>Quick Access</SectionLabel>
          {quickNav.map(item => <NavItem key={item.href} {...item} />)}
        </div>
      </nav>

      {/* Settings + User */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <NavItem icon={Settings} label="Settings" href="/app/settings" />

        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link href="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-purple-500/5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              {user.avatarInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{user.email}</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  )
}
