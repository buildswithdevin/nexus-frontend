'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bookmark, Sparkles, Tag, MessageSquare, FolderOpen, Brain,
  ArrowRight, Zap, Search, BookOpen, Plus, ChevronRight,
  Database, Layers, Compass, TrendingUp, Shield, Code2,
  BarChart3, CheckCircle, Network, Send, Globe,
  GitBranch, Target, Filter, Star, ExternalLink,
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const WALKTHROUGH_STEPS = [
  { label: 'Paste Anything',    icon: Plus,        color: '#8b5cf6' },
  { label: 'Smart Analysis',    icon: Sparkles,    color: '#6366f1' },
  { label: 'Auto Collections',  icon: FolderOpen,  color: '#3b82f6' },
  { label: 'Discover',          icon: Compass,     color: '#10b981' },
  { label: 'Ask NEXUS',         icon: MessageSquare, color: '#f59e0b' },
]

const HOW_IT_WORKS = [
  {
    icon: Plus,
    title: 'Paste Anything',
    description: 'Drop in URLs, raw text, or bulk links. NEXUS scrapes and ingests everything automatically.',
    color: '#8b5cf6',
  },
  {
    icon: Sparkles,
    title: 'NEXUS Organizes It',
    description: 'AI generates summaries, smart tags, categories, and auto-assigns every source to a collection.',
    color: '#6366f1',
  },
  {
    icon: Compass,
    title: 'Discover Related Knowledge',
    description: 'Personalized recommendations appear based on your library, recent searches, and interests.',
    color: '#3b82f6',
  },
  {
    icon: MessageSquare,
    title: 'Ask Across Your Library',
    description: 'Semantic search + Claude synthesis answers any question using your saved knowledge.',
    color: '#10b981',
  },
]

const FEATURES = [
  {
    icon: Bookmark,
    title: 'Paste Anything',
    description: 'URLs, articles, tools, videos, raw text, or bulk pastes. One action to capture anything.',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Search,
    title: 'Smart Semantic Search',
    description: 'Vector-powered search finds sources by meaning, not just keywords. Works offline too.',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: FolderOpen,
    title: 'Auto Collections',
    description: 'Collections form automatically from your library. AI groups related sources into named clusters.',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: MessageSquare,
    title: 'Ask Your Library',
    description: 'Chat with your entire knowledge base. Get cited answers synthesized from your saved sources.',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: Compass,
    title: 'Discover Recommendations',
    description: 'Personalized tool and topic recommendations based on your library, interests, and usage.',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    icon: GitBranch,
    title: 'Learning Paths',
    description: 'Curated stacks of related tools — Frontend, AI, Backend, Robotics — matched to your interests.',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: BarChart3,
    title: 'Knowledge Insights',
    description: 'AI analysis of your full library reveals focus areas, trends, and what to explore next.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: Network,
    title: 'Knowledge Gaps',
    description: 'NEXUS identifies adjacent topics you haven\'t saved yet — based on your existing interests.',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Target,
    title: 'Adaptive Recommendations',
    description: 'Like, dislike, or dismiss suggestions. NEXUS learns your preferences and refines its model.',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: Brain,
    title: 'Workspace Customization',
    description: 'Themes, background presets, library views, and filter/sort preferences. Your workspace, your way.',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
  },
  {
    icon: Shield,
    title: 'Responsible AI Layer',
    description: 'Built-in safety classification blocks harmful queries and flags restricted content automatically.',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.1)',
  },
]

const LEARNING_PATHS = [
  {
    name: 'Frontend Developer Stack',
    category: 'Development',
    color: '#6366f1',
    tools: ['shadcn/ui', 'Vite', 'Zustand', 'TanStack Query', 'Framer Motion', 'Playwright'],
    description: 'Build production-ready web UIs with the modern React ecosystem.',
  },
  {
    name: 'AI/ML Toolkit',
    category: 'AI & ML',
    color: '#8b5cf6',
    tools: ['Ollama', 'LangChain', 'LlamaIndex', 'Hugging Face', 'Weights & Biases', 'Groq'],
    description: 'Run, fine-tune, and build with LLMs and ML models — local or cloud.',
  },
  {
    name: 'Robotics Starter Stack',
    category: 'Robotics',
    color: '#3b82f6',
    tools: ['PlatformIO', 'ROS2', 'OpenCV', 'FreeRTOS', 'Gazebo', 'Edge Impulse'],
    description: 'Everything you need to go from zero to building real robotic systems.',
  },
  {
    name: 'Backend API Stack',
    category: 'Development',
    color: '#10b981',
    tools: ['Supabase', 'Pydantic', 'SQLAlchemy', 'Hono', 'tRPC', 'Drizzle ORM'],
    description: 'Build robust, type-safe backend services and databases.',
  },
]

const KNOWLEDGE_GAPS = [
  {
    area: 'AI & ML',
    reason: 'Complements your Development knowledge — strong adjacent demand.',
    color: '#8b5cf6',
    icon: Sparkles,
  },
  {
    area: 'Data Science',
    reason: 'Builds on your ML interests — adds analysis and visualization layers.',
    color: '#6366f1',
    icon: BarChart3,
  },
  {
    area: 'Cloud & DevOps',
    reason: 'Extends your backend knowledge into deployment and infrastructure.',
    color: '#3b82f6',
    icon: Globe,
  },
  {
    area: 'Productivity',
    reason: 'Complements any technical knowledge base with workflow tooling.',
    color: '#10b981',
    icon: Target,
  },
]

// ── Walkthrough panels ────────────────────────────────────────────────────────

function PanelPasteAnything() {
  return (
    <div className="h-full flex flex-col" style={{ animation: 'wt-fadeIn 0.4s ease forwards' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)' }}>
          <Plus className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
        </div>
        <span className="text-sm font-semibold text-white">Add to NEXUS</span>
      </div>

      <div className="rounded-xl border p-3 mb-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
        {[
          { url: 'https://react.dev/learn', delay: '0.1s' },
          { url: 'https://docs.anthropic.com/claude', delay: '0.3s' },
          { url: 'https://langchain.readthedocs.io', delay: '0.5s' },
        ].map(({ url, delay }) => (
          <div key={url} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', animation: `wt-slideIn 0.4s ${delay} ease both` }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#a78bfa' }} />
            <span className="text-xs font-mono" style={{ color: '#c4b5fd' }}>{url}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', animation: 'wt-slideIn 0.4s 0.7s ease both' }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#818cf8' }} />
          <span className="text-xs" style={{ color: '#a5b4fc' }}>Building RAG applications with Python and LlamaIndex...</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs" style={{ color: '#6b7280' }}>4 sources ready</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
          Paste or type anything
        </span>
      </div>

      <button
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-auto"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.3)', animation: 'wt-fadeIn 0.4s 0.8s ease both' }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Add to NEXUS
      </button>
    </div>
  )
}

function PanelSmartAnalysis() {
  return (
    <div className="h-full flex flex-col gap-3" style={{ animation: 'wt-fadeIn 0.4s ease forwards' }}>
      <div className="p-3.5 rounded-xl border" style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)' }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-white">React Documentation</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>react.dev</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            <Sparkles className="w-2.5 h-2.5" />
            Analyzed
          </span>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: '#9ca3af', animation: 'wt-fadeIn 0.5s 0.3s ease both' }}>
          Comprehensive guide to React including hooks, components, and the modern ecosystem. Covers React Server Components, concurrent features, and the new App Router.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2" style={{ animation: 'wt-fadeIn 0.4s 0.5s ease both' }}>
          {['react', 'frontend', 'javascript', 'hooks', 'typescript'].map((tag, i) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', animation: `wt-scalePop 0.3s ${0.5 + i * 0.08}s ease both` }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>Development</span>
          <span className="text-xs" style={{ color: '#6b7280' }}>Advanced</span>
        </div>
      </div>

      <div className="p-3 rounded-xl border" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.15)', animation: 'wt-slideIn 0.4s 0.7s ease both' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Database className="w-3 h-3" style={{ color: '#34d399' }} />
          <span className="text-xs font-medium" style={{ color: '#34d399' }}>Anthropic Claude API Docs</span>
        </div>
        <p className="text-xs" style={{ color: '#6b7280' }}>Summary generated · Category: AI & ML · 6 tags</p>
      </div>

      <div className="p-3 rounded-xl border" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.15)', animation: 'wt-slideIn 0.4s 0.85s ease both' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <Database className="w-3 h-3" style={{ color: '#818cf8' }} />
          <span className="text-xs font-medium" style={{ color: '#818cf8' }}>Building RAG Apps with Python</span>
        </div>
        <p className="text-xs" style={{ color: '#6b7280' }}>Summary generated · Category: AI & ML · 8 tags</p>
      </div>
    </div>
  )
}

function PanelAutoCollections() {
  const collections = [
    { name: 'React Frontend', color: '#6366f1', count: 3, sources: ['React Docs', 'Next.js Guide', 'Tailwind CSS'] },
    { name: 'AI & LLMs', color: '#8b5cf6', count: 4, sources: ['Anthropic API', 'LangChain', 'LlamaIndex'] },
    { name: 'System Design', color: '#3b82f6', count: 2, sources: ['Architecture Guide', 'Redis Patterns'] },
  ]
  return (
    <div className="h-full flex flex-col gap-3" style={{ animation: 'wt-fadeIn 0.4s ease forwards' }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white">Collections</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
          Auto-organized
        </span>
      </div>
      {collections.map(({ name, color, count, sources }, i) => (
        <div key={name} className="p-3.5 rounded-xl border" style={{ background: '#0d0d22', borderColor: 'rgba(255,255,255,0.08)', animation: `wt-slideIn 0.4s ${i * 0.15}s ease both` }}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
              <FolderOpen className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{count} sources</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sources.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PanelDiscover() {
  return (
    <div className="h-full flex flex-col gap-3" style={{ animation: 'wt-fadeIn 0.4s ease forwards' }}>
      <div className="flex items-center gap-2 mb-1">
        <Compass className="w-4 h-4" style={{ color: '#34d399' }} />
        <p className="text-sm font-semibold text-white">Discover</p>
      </div>

      <p className="text-xs" style={{ color: '#6b7280', animation: 'wt-fadeIn 0.4s 0.1s ease both' }}>
        Because you saved <span style={{ color: '#a78bfa' }}>React Documentation</span>...
      </p>

      <div className="p-3.5 rounded-xl border" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)', animation: 'wt-slideIn 0.4s 0.2s ease both' }}>
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold text-white">shadcn/ui</p>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>Development</span>
        </div>
        <p className="text-xs mb-2.5" style={{ color: '#9ca3af' }}>Beautiful, accessible React components built on Radix UI and Tailwind — copy-paste into your app.</p>
        <div className="flex flex-wrap gap-1">
          {['react', 'tailwind', 'ui', 'frontend'].map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl border" style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)', animation: 'wt-slideIn 0.4s 0.35s ease both' }}>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
          <p className="text-xs font-semibold" style={{ color: '#a78bfa' }}>Learning Path: Frontend Stack</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Vite', '→', 'Zustand', '→', 'Framer Motion'].map((item, i) => (
            <span key={i} className="text-xs" style={{ color: item === '→' ? '#4b5563' : '#9ca3af' }}>{item}</span>
          ))}
        </div>
      </div>

      <div className="p-2.5 rounded-xl border" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.15)', animation: 'wt-slideIn 0.4s 0.5s ease both' }}>
        <p className="text-xs" style={{ color: '#34d399' }}>Knowledge gap detected: <span style={{ color: '#9ca3af' }}>Data Science — 0 sources</span></p>
      </div>
    </div>
  )
}

function PanelAskNexus() {
  return (
    <div className="h-full flex flex-col" style={{ animation: 'wt-fadeIn 0.4s ease forwards' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <MessageSquare className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
        </div>
        <span className="text-sm font-semibold text-white">Ask Your Library</span>
      </div>

      {/* User message */}
      <div className="flex justify-end mb-3" style={{ animation: 'wt-fadeIn 0.4s 0.1s ease both' }}>
        <div className="max-w-xs px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
          What frontend tools have I saved?
        </div>
      </div>

      {/* NEXUS response */}
      <div className="flex gap-2.5 mb-3" style={{ animation: 'wt-fadeIn 0.5s 0.5s ease both' }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
        </div>
        <div className="flex-1">
          <p className="text-xs leading-relaxed mb-2" style={{ color: '#d1d5db' }}>
            Your library has <strong className="text-white">strong matches</strong> for frontend development. <span style={{ color: '#c4b5fd' }}>&ldquo;React Documentation&rdquo;</span> covers React fundamentals and <span style={{ color: '#c4b5fd' }}>&ldquo;Next.js Guide&rdquo;</span> covers server components and App Router.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {['React Docs', 'Next.js Guide', 'Tailwind CSS'].map((s, i) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', animation: `wt-scalePop 0.3s ${0.8 + i * 0.1}s ease both` }}>
                <BookOpen className="w-2.5 h-2.5" />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="mt-auto flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <span className="flex-1 text-xs" style={{ color: '#4b5563' }}>Ask anything about your library…</span>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <Send className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  )
}

const STEP_PANELS = [
  PanelPasteAnything,
  PanelSmartAnalysis,
  PanelAutoCollections,
  PanelDiscover,
  PanelAskNexus,
]

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const walkthroughRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setActiveStep(p => (p + 1) % 5), 4000)
    return () => clearInterval(id)
  }, [paused])

  const ActivePanel = STEP_PANELS[activeStep]

  return (
    <div className="min-h-screen" style={{ background: '#06060f' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6', boxShadow: '0 0 8px rgba(139,92,246,0.9)' }} />
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[['#how-it-works', 'How It Works'], ['#features', 'Features'], ['#discover', 'Discover'], ['#paths', 'Learning Paths']].map(([href, label]) => (
              <a key={label} href={href} className="text-sm transition-colors duration-200" style={{ color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
              >{label}</a>
            ))}
          </div>
          <Link
            href="/app"
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
          >
            Open App
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 62%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '10%', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute pointer-events-none" style={{ top: '20%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border text-sm font-medium"
            style={{ borderColor: 'rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.09)', color: '#a78bfa' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Knowledge Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Turn the internet into your{' '}
            <span className="gradient-text">personal AI</span>
            {' '}knowledge system.
          </h1>

          <p className="text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed" style={{ color: '#9ca3af' }}>
            Save, organize, discover, and learn from everything across the internet.
          </p>
          <p className="text-base mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: '#6b7280' }}>
            Paste links or raw text. NEXUS automatically summarizes, tags, organizes, and lets you ask questions across your entire saved library.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 40px rgba(139,92,246,0.35)' }}
            >
              Open App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium border transition-all duration-200"
              style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa', background: 'rgba(139,92,246,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)' }}
            >
              Try Demo
              <Sparkles className="w-4 h-4" />
            </Link>
            <a
              href="#walkthrough"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium border transition-all duration-200"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#d1d5db' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6b7280' }}
            >
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
            {[
              { icon: Shield, label: 'Responsible AI' },
              { icon: Database, label: 'Semantic Search' },
              { icon: Network, label: 'Auto-Organization' },
              { icon: BookOpen, label: 'Knowledge Synthesis' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: '#4b5563' }} />
                <span className="text-xs" style={{ color: '#4b5563' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Animated Walkthrough ─────────────────────────────────────────────── */}
      <section id="walkthrough" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Sparkles className="w-3 h-3" />
              Product Showcase
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See NEXUS in{' '}
              <span className="gradient-text">action</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              Watch the full workflow — from raw links to organized knowledge — in five steps.
            </p>
          </div>

          <div
            ref={walkthroughRef}
            className="rounded-3xl border overflow-hidden"
            style={{ borderColor: 'rgba(139,92,246,0.2)', background: '#08081a', boxShadow: '0 0 80px rgba(139,92,246,0.12), 0 40px 80px rgba(0,0,0,0.6)' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#06060f' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,100,100,0.5)' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,200,100,0.5)' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(100,200,100,0.5)' }} />
              <div className="flex-1 mx-4">
                <div className="mx-auto max-w-xs h-6 rounded-md flex items-center justify-center px-3 text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: '#4b5563' }}>
                  nexus.app / {['add', 'library', 'collections', 'discover', 'ask'][activeStep]}
                </div>
              </div>
            </div>

            {/* Step tabs */}
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#07071a' }}>
              {WALKTHROUGH_STEPS.map((step, i) => {
                const Icon = step.icon
                const isActive = i === activeStep
                return (
                  <button
                    key={i}
                    onClick={() => { setActiveStep(i); setPaused(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all duration-300 relative"
                    style={{ color: isActive ? '#fff' : '#4b5563' }}
                  >
                    {isActive && (
                      <div className="absolute inset-0" style={{ background: 'rgba(139,92,246,0.08)', borderBottom: `2px solid ${step.color}` }} />
                    )}
                    <Icon className="w-3 h-3 relative z-10" style={{ color: isActive ? step.color : '#4b5563' }} />
                    <span className="hidden sm:block relative z-10">{step.label}</span>
                    <span className="sm:hidden relative z-10">{i + 1}</span>
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex" style={{ minHeight: '380px' }}>
              {/* Sidebar */}
              <div className="hidden md:flex w-52 border-r flex-col py-5" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#08081a' }}>
                <div className="px-4 mb-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-bold text-white">NEXUS</span>
                    <div className="w-1 h-1 rounded-full" style={{ background: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }} />
                  </div>
                  <p className="text-xs" style={{ color: '#4b5563' }}>Knowledge Hub</p>
                </div>
                <div className="flex-1 px-2 space-y-0.5">
                  {[
                    { icon: BookOpen, label: 'Library', step: 1 },
                    { icon: FolderOpen, label: 'Collections', step: 2 },
                    { icon: Plus, label: 'Add Source', step: 0 },
                    { icon: Compass, label: 'Discover', step: 3 },
                    { icon: MessageSquare, label: 'Ask NEXUS', step: 4 },
                    { icon: BarChart3, label: 'Insights', step: -1 },
                  ].map(({ icon: Icon, label, step }) => {
                    const isActive = step === activeStep
                    return (
                      <div
                        key={label}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
                        style={isActive ? { background: 'rgba(139,92,246,0.18)', color: '#fff' } : { color: '#4b5563' }}
                        onClick={() => step >= 0 && (setActiveStep(step), setPaused(true))}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: isActive ? WALKTHROUGH_STEPS[activeStep]?.color || '#a78bfa' : '#4b5563' }} />
                        {label}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Main panel */}
              <div className="flex-1 p-6 overflow-hidden" style={{ background: '#06060f' }}>
                <div key={activeStep} style={{ height: '100%' }}>
                  <ActivePanel />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${((activeStep + 1) / 5) * 100}%`,
                  background: `linear-gradient(90deg, #8b5cf6, ${WALKTHROUGH_STEPS[activeStep].color})`,
                  boxShadow: `0 0 8px ${WALKTHROUGH_STEPS[activeStep].color}`,
                }}
              />
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {WALKTHROUGH_STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => { setActiveStep(i); setPaused(true) }}
                className="transition-all duration-300 rounded-full"
                style={i === activeStep
                  ? { width: '24px', height: '6px', background: step.color, boxShadow: `0 0 8px ${step.color}` }
                  : { width: '6px', height: '6px', background: 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How <span className="gradient-text">NEXUS</span> works
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              From raw links to structured, searchable knowledge in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="relative flex flex-col items-center text-center px-6">
                  {/* Connector line */}
                  {i < 3 && (
                    <div className="absolute top-9 left-[calc(50%+28px)] right-0 h-px hidden md:block" style={{ background: `linear-gradient(90deg, ${step.color}60, ${HOW_IT_WORKS[i + 1].color}60)` }} />
                  )}

                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative z-10"
                    style={{ background: `${step.color}18`, border: `1px solid ${step.color}30`, boxShadow: `0 0 20px ${step.color}20` }}
                  >
                    <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: step.color, color: '#fff' }}>{i + 1}</span>
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ height: '600px', background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)', transform: 'translateY(-200px)' }}
        />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Star className="w-3 h-3" />
              Full Feature Set
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything to{' '}
              <span className="gradient-text">think better</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              NEXUS brings together saving, organizing, discovering, and querying into one intelligent workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-5 rounded-2xl border cursor-default transition-all duration-300 group"
                  style={{ background: '#0d0d22', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = `${feature.color}40`
                    el.style.boxShadow = `0 0 24px ${feature.color}15`
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(255,255,255,0.06)'
                    el.style.boxShadow = 'none'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3.5" style={{ background: feature.bg }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: feature.color, width: '18px', height: '18px' }} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Discover Section ──────────────────────────────────────────────────── */}
      <section id="discover" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: explanation */}
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Compass className="w-3 h-3" />
                Discover Engine
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-snug">
                Your library powers{' '}
                <span className="gradient-text">what you discover next</span>
              </h2>

              <p className="text-base leading-relaxed mb-8" style={{ color: '#6b7280' }}>
                NEXUS builds a model of your interests from every source you save and every question you ask — then uses it to surface exactly what you should explore next.
              </p>

              <div className="space-y-4">
                {[
                  { icon: BookOpen, label: '"Because you saved…" recommendations', desc: 'Every source you save trains what NEXUS suggests next.' },
                  { icon: GitBranch, label: 'Learning paths for your interests', desc: 'Curated stacks of related tools matched to your exact profile.' },
                  { icon: Network, label: 'Adjacent knowledge detection', desc: 'Identifies related areas you haven\'t explored yet.' },
                  { icon: Target, label: 'Like/dislike feedback loop', desc: 'Thumbs up or dismiss any recommendation — NEXUS adapts.' },
                  { icon: MessageSquare, label: 'Ask NEXUS influences Discover', desc: 'Your questions shape future recommendations automatically.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white mb-0.5">{label}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mock Discover panel */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#08081a', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(16,185,129,0.08)' }}>
              {/* Header */}
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#06060f' }}>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4" style={{ color: '#34d399' }} />
                  <span className="text-sm font-semibold text-white">Discover</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>Personalized</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Interest summary */}
                <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                  Your library focuses on <span style={{ color: '#a78bfa' }}>AI & ML</span> and <span style={{ color: '#818cf8' }}>Development</span>, with strong interests in{' '}
                  <span style={{ color: '#9ca3af' }}>react, llm, python</span>. 47 sources saved.
                </p>

                {/* Because you saved section */}
                <div>
                  <p className="text-xs mb-2.5" style={{ color: '#4b5563' }}>
                    Because you saved <span style={{ color: '#a78bfa' }}>Anthropic Claude API</span>...
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'LangChain', desc: 'Framework for building LLM apps with chains and agents.', tags: ['llm', 'python', 'ai'], cat: 'AI & ML', color: '#8b5cf6' },
                      { name: 'LlamaIndex', desc: 'Connect LLMs to external data — ideal for RAG pipelines.', tags: ['rag', 'llm', 'embedding'], cat: 'AI & ML', color: '#6366f1' },
                    ].map(({ name, desc, tags, cat, color }) => (
                      <div key={name} className="p-3.5 rounded-xl border transition-all duration-200" style={{ background: '#0d0d22', borderColor: 'rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40` }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-sm font-semibold text-white">{name}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded ml-2 flex-shrink-0" style={{ background: `${color}18`, color }}>{cat}</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: '#6b7280' }}>{desc}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#4b5563' }}>{t}</span>)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button className="text-xs px-2 py-0.5 rounded" style={{ color: '#34d399' }}>↑</button>
                            <button className="text-xs px-2 py-0.5 rounded" style={{ color: '#6b7280' }}>↓</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledge gap */}
                <div className="p-3 rounded-xl border" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#fbbf24' }}>Knowledge gap detected</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    <span style={{ color: '#d1d5db' }}>Data Science</span> — 0 sources. Complements your ML knowledge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning Paths ────────────────────────────────────────────────────── */}
      <section id="paths" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
              <GitBranch className="w-3 h-3" />
              Learning Paths
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Curated stacks for{' '}
              <span className="gradient-text">every focus area</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              NEXUS surfaces pre-built learning paths matched to your library. Each path includes the tools, docs, and resources you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {LEARNING_PATHS.map(({ name, category, color, tools, description }) => (
              <div
                key={name}
                className="p-6 rounded-2xl border transition-all duration-300"
                style={{ background: '#0d0d22', borderColor: 'rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.boxShadow = `0 0 30px ${color}12` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <GitBranch className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-0.5">{name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{category}</span>
                  </div>
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#6b7280' }}>{description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool, i) => (
                    <span key={tool} className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5" style={{ background: i === 0 ? `${color}18` : 'rgba(255,255,255,0.05)', color: i === 0 ? color : '#6b7280', border: `1px solid ${i === 0 ? `${color}30` : 'rgba(255,255,255,0.05)'}` }}>
                      {i > 0 && <span style={{ color: '#374151', fontSize: '8px' }}>→</span>}
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Knowledge Gaps ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border p-10 relative overflow-hidden" style={{ borderColor: 'rgba(139,92,246,0.15)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.04) 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Network className="w-3 h-3" />
                  Intelligent Gap Detection
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Discover what your library is missing
                </h2>
                <p className="text-base leading-relaxed" style={{ color: '#6b7280' }}>
                  NEXUS maps adjacent knowledge areas based on your existing interests — surfacing topics you haven't saved yet but would benefit from.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {KNOWLEDGE_GAPS.map(({ area, reason, color, icon: Icon }) => (
                  <div
                    key={area}
                    className="p-4 rounded-xl border transition-all duration-200"
                    style={{ background: 'rgba(13,13,34,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 0 16px ${color}12` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{area}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Positioning ───────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Code2 className="w-3 h-3" />
            Built for the Modern Era
          </div>
          <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#9ca3af' }}>
            Built as a full-stack adaptive knowledge platform using{' '}
            <span style={{ color: '#c4b5fd' }}>semantic vector search</span>,{' '}
            <span style={{ color: '#a5b4fc' }}>intelligent auto-organization</span>,{' '}
            <span style={{ color: '#93c5fd' }}>personalized recommendation systems</span>, and{' '}
            <span style={{ color: '#86efac' }}>modern AI synthesis workflows</span>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {['FastAPI', 'Next.js 16', 'ChromaDB', 'Claude AI', 'SQLAlchemy', 'Sentence Transformers', 'React 19', 'Tailwind v4'].map(tech => (
              <span key={tech} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="p-14 rounded-3xl border relative overflow-hidden"
            style={{
              borderColor: 'rgba(139,92,246,0.25)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.07) 100%)',
              boxShadow: '0 0 80px rgba(139,92,246,0.15)',
            }}
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.2) 0%, transparent 60%)', animation: 'ctaGlow 4s ease-in-out infinite' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.1) 0%, transparent 60%)', animation: 'ctaGlow 4s ease-in-out 2s infinite' }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Zap className="w-3 h-3" />
                Free to use
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                Start building your<br />
                <span className="gradient-text">knowledge base today</span>
              </h2>

              <p className="text-base mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: '#6b7280' }}>
                Join researchers, developers, and learners who use NEXUS to turn the internet into their personal intelligence system.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}
                >
                  Open App
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/app"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium border transition-all duration-200"
                  style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa', background: 'rgba(139,92,246,0.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                >
                  <BookOpen className="w-4 h-4" />
                  Start Building Your Knowledge Base
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
                {[
                  { icon: CheckCircle, label: 'No account required' },
                  { icon: Shield, label: 'Responsible AI built-in' },
                  { icon: Database, label: 'Local-first storage' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                    <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">NEXUS</span>
            <div className="w-1 h-1 rounded-full" style={{ background: '#8b5cf6' }} />
          </div>
          <p className="text-sm" style={{ color: '#4b5563' }}>
            NEXUS © 2026 · Built by <span style={{ color: '#6b7280' }}>Devin Hill</span> with AI-assisted development
          </p>
          <div className="flex items-center gap-5">
            {[['#features', 'Features'], ['#discover', 'Discover'], ['#paths', 'Paths'], ['/app', 'Open App']].map(([href, label]) => (
              <a key={label} href={href} className="text-xs transition-colors duration-200" style={{ color: '#4b5563' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
              >{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
