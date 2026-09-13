'use client';

import React from 'react';
import { 
  Radio, 
  ShieldCheck, 
  Cpu, 
  CircleCheck, 
  Lock, 
  ArrowRight,
  ArrowDown,
  Database,
  ExternalLink,
  Terminal,
  Tag,
  Zap,
  Gamepad2,
  Globe,
  Cable,
  Monitor,
  CodeXml,
  Network,
  Boxes,
  Braces,
  Cloud,
  Bot,
  Mic,
  MessageSquare,
  Send,
  RefreshCw,
  FileBraces,
  ChartLine
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { TechLogo } from './techIcons';

const ACCENTS: Record<string, { text: string; dot: string }> = {
  emerald: { text: 'text-[var(--emerald-accent)]', dot: 'bg-[var(--emerald-accent)]' },
  sky: { text: 'text-[var(--sky-accent)]', dot: 'bg-[var(--sky-accent)]' },
  amber: { text: 'text-[var(--amber-accent)]', dot: 'bg-[var(--amber-accent)]' },
  indigo: { text: 'text-[var(--indigo-accent)]', dot: 'bg-[var(--indigo-accent)]' }
};

const ARCH_LAYERS = [
  { icon: Gamepad2, accent: 'emerald', nameKey: 'liveArchitecture.layerGame', name: 'Big Ambitions', roleKey: 'liveArchitecture.layerGameRole', role: 'The game', descKey: 'liveArchitecture.layerGameDesc', desc: 'Unity + C#. Your whole empire lives in memory: cash, stores, staff, stock and buildings.' },
  { icon: Radio, accent: 'amber', nameKey: 'liveArchitecture.layerMod', name: 'Companion Mod', roleKey: 'liveArchitecture.layerModRole', role: 'The bridge', descKey: 'liveArchitecture.layerModDesc', desc: 'A small C# engine reads the save, turns it into JSON and serves it over localhost.' },
  { icon: Cable, accent: 'sky', nameKey: 'liveArchitecture.layerLoopback', name: 'Localhost', roleKey: 'liveArchitecture.layerLoopbackRole', role: 'The transport', descKey: 'liveArchitecture.layerLoopbackDesc', desc: '127.0.0.1:8765. Reads only, local only. The single channel between game and app.' },
  { icon: Monitor, accent: 'indigo', nameKey: 'liveArchitecture.layerApp', name: 'Live HQ', roleKey: 'liveArchitecture.layerAppRole', role: 'The app', descKey: 'liveArchitecture.layerAppDesc', desc: 'Next.js + React. Polls the bridge, normalizes the data and renders every dashboard.' }
];

const SIDE_SERVICES = [
  { icon: Database, titleKey: 'liveArchitecture.sideCompendiumTitle', title: 'Game compendium', descKey: 'liveArchitecture.sideCompendiumDesc', desc: 'Static game data extracted from the game files.' },
  { icon: Bot, titleKey: 'liveArchitecture.sideAiTitle', title: 'Uncle Fred AI', descKey: 'liveArchitecture.sideAiDesc', desc: 'Your own Gemini key. The browser talks to Google, only when you use the advisor.' },
  { icon: Mic, titleKey: 'liveArchitecture.sideVoiceTitle', title: 'Voice', descKey: 'liveArchitecture.sideVoiceDesc', desc: 'Uncle Fred speaks through an online, serverless text-to-speech engine (free, nothing to install).' },
  { icon: MessageSquare, titleKey: 'liveArchitecture.sideReportsTitle', title: 'Reports', descKey: 'liveArchitecture.sideReportsDesc', desc: 'A Discord form, only when you choose to send.' }
];

const BLOCK_GROUPS = [
  {
    icon: CodeXml,
    accent: 'emerald',
    titleKey: 'liveArchitecture.groupModTitle',
    title: 'In the game',
    blocks: [
      { icon: CodeXml, titleKey: 'liveArchitecture.blockModTitle', title: 'Telemetry engine', descKey: 'liveArchitecture.blockModDesc', desc: 'One shared C# engine reads SaveGameManager by reflection, caches day-scoped financials and serializes JSON with Newtonsoft.' },
      { icon: Network, titleKey: 'liveArchitecture.blockBridgeTitle', title: 'Loopback bridge', descKey: 'liveArchitecture.blockBridgeDesc', desc: 'An embedded HttpListener on 127.0.0.1:8765 answers GET and OPTIONS only, with CORS and Private Network Access headers so a secure page can reach localhost.' },
      { icon: Boxes, titleKey: 'liveArchitecture.blockTargetsTitle', title: 'Two mod targets', descKey: 'liveArchitecture.blockTargetsDesc', desc: 'The Steam Workshop native mod and the MelonLoader standalone compile the same engine into two DLLs, so behaviour is identical.' }
    ]
  },
  {
    icon: Monitor,
    accent: 'sky',
    titleKey: 'liveArchitecture.groupWebTitle',
    title: 'In your browser',
    blocks: [
      { icon: Monitor, titleKey: 'liveArchitecture.blockWebTitle', title: 'Live HQ frontend', descKey: 'liveArchitecture.blockWebDesc', desc: 'Next.js App Router, React and TypeScript. One context polls the bridge, normalizes a typed state, caches it for instant reloads and feeds every view.' },
      { icon: Database, titleKey: 'liveArchitecture.blockDataTitle', title: 'Game compendium', descKey: 'liveArchitecture.blockDataDesc', desc: 'Items, businesses, buildings, districts and suppliers pulled from the game into static JSON, plus the calculation engines that use them.' }
    ]
  },
  {
    icon: Cloud,
    accent: 'indigo',
    titleKey: 'liveArchitecture.groupServicesTitle',
    title: 'Optional services',
    blocks: [
      { icon: Bot, titleKey: 'liveArchitecture.blockAiTitle', title: 'Uncle Fred AI', descKey: 'liveArchitecture.blockAiDesc', desc: 'Bring your own Gemini key. The browser sends a compact empire summary straight to Google, only while you chat with the advisor.' },
      { icon: Mic, titleKey: 'liveArchitecture.blockVoiceTitle', title: 'Online voice', descKey: 'liveArchitecture.blockVoiceDesc', desc: 'Uncle Fred speaks through a serverless XTTS text-to-speech engine in the cloud (free, nothing to install), with a local fallback for development.' },
      { icon: MessageSquare, titleKey: 'liveArchitecture.blockReportsTitle', title: 'Reports', descKey: 'liveArchitecture.blockReportsDesc', desc: 'Bug and suggestion reports post to Discord through a bot, with a privacy-scrubbed snapshot and optional in-game diagnostics.' }
    ]
  }
];

const FLOW = [
  { icon: Gamepad2, titleKey: 'liveArchitecture.flowStep1Title', title: 'The game ticks', descKey: 'liveArchitecture.flow1', desc: 'The game updates its in-memory state as you play.' },
  { icon: Send, titleKey: 'liveArchitecture.flowStep2Title', title: 'Live HQ asks', descKey: 'liveArchitecture.flow2', desc: 'It asks the bridge for the latest over loopback, at your chosen cadence.' },
  { icon: RefreshCw, titleKey: 'liveArchitecture.flowStep3Title', title: 'The mod rebuilds', descKey: 'liveArchitecture.flow3', desc: 'Only when needed, reading the save and reusing day-scoped caches.' },
  { icon: FileBraces, titleKey: 'liveArchitecture.flowStep4Title', title: 'One payload', descKey: 'liveArchitecture.flow4', desc: 'Serialized to JSON and returned. Nothing is written to disk.' },
  { icon: Monitor, titleKey: 'liveArchitecture.flowStep5Title', title: 'You see it', descKey: 'liveArchitecture.flow5', desc: 'The app normalizes, caches and re-renders the dashboards.' }
];

const STACK_GROUPS = [
  {
    icon: Braces,
    titleKey: 'liveArchitecture.stackMod',
    title: 'Mod',
    descKey: 'liveArchitecture.stackModDesc',
    desc: 'Runs inside the game and serves the data over localhost.',
    items: [
      { name: 'C# / .NET', logo: 'logos:dotnet', slug: 'dotnet' },
      { name: 'Unity', logo: 'logos:unity', slug: 'unity', mono: true },
      { name: 'Steam Workshop', logo: 'logos:steam', slug: 'steam', mono: true },
      { name: 'Newtonsoft.Json', logo: 'logos:json', slug: 'json', mono: true }
    ]
  },
  {
    icon: Monitor,
    titleKey: 'liveArchitecture.stackWeb',
    title: 'Web app',
    descKey: 'liveArchitecture.stackWebDesc',
    desc: 'The interface you use in the browser.',
    items: [
      { name: 'Next.js', logo: 'logos:nextjs-icon', slug: 'nextdotjs', mono: true },
      { name: 'React', logo: 'logos:react', slug: 'react' },
      { name: 'TypeScript', logo: 'logos:typescript-icon', slug: 'typescript' },
      { name: 'Tailwind CSS', logo: 'logos:tailwindcss-icon', slug: 'tailwindcss' },
      { name: 'Recharts', icon: ChartLine }
    ]
  },
  {
    icon: Cloud,
    titleKey: 'liveArchitecture.stackServices',
    title: 'Services',
    descKey: 'liveArchitecture.stackServicesDesc',
    desc: 'Optional online extras, off unless you use them.',
    items: [
      { name: 'Vercel', logo: 'logos:vercel-icon', slug: 'vercel', mono: true },
      { name: 'Google Gemini', logo: 'logos:google-gemini-icon', slug: 'googlegemini' },
      { name: 'Modal', logo: 'thesvg-color:modal', slug: 'modal' },
      { name: 'Discord', logo: 'logos:discord-icon', slug: 'discord' }
    ]
  }
];

export default function LiveArchitecturePage() {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-5xl space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border-base)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] text-xs font-semibold">
          <Radio className="w-3.5 h-3.5" />
          <span>{t('liveArchitecture.badge', 'Live HQ Bridge')}</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
          {t('liveArchitecture.title', 'System Architecture')}
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
          {t('liveArchitecture.intro', 'A local-first companion: the game and the web app never talk through a server in the middle. Here is how the pieces fit together, what runs where, and how your data stays on your machine.')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Radio className="w-4 h-4 text-[var(--emerald-accent)]" />
              <span>{t('liveArchitecture.offlineLoopback', '100% Offline Loopback')}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('liveArchitecture.offlineLoopbackDesc', 'Talks to the game strictly on 127.0.0.1:8765, which is your own machine. No company data or save names ever leave it.')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Lock className="w-4 h-4 text-[var(--sky-accent)]" />
              <span>{t('liveArchitecture.readOnlySafety', 'Read-Only')}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('liveArchitecture.readOnlySafetyDesc', 'The mod only serves GET requests. There are no write operations, so your save is never touched.')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Cpu className="w-4 h-4 text-[var(--amber-accent)]" />
              <span>{t('liveArchitecture.cachedOnDemand', 'On-Demand & Cached')}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('liveArchitecture.cachedOnDemandDesc', 'It only rebuilds data when the app asks, and caches day-scoped figures, so there is no per-frame stutter.')}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: The big picture */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Boxes className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('liveArchitecture.bigPictureTitle', '1. The big picture')}</h2>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-6">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('liveArchitecture.bigPictureIntro', 'Four layers, one direction: your game state flows out to your screen. Every optional part sits beside the pipeline, never inside it.')}
          </p>

          {/* Pipeline diagram */}
          <div
            className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-base)] p-4"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          >
            <div className="flex flex-col lg:flex-row items-stretch gap-1.5 lg:gap-0">
              {ARCH_LAYERS.map((layer, i) => (
                <React.Fragment key={layer.nameKey}>
                  <div className="relative flex-1 min-w-0 rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 pt-5 shadow-xs">
                    <span className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${ACCENTS[layer.accent].dot}`} />
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                        <layer.icon className={`w-4 h-4 ${ACCENTS[layer.accent].text}`} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[var(--text-subtle)]">0{i + 1}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">{t(layer.nameKey, layer.name)}</h3>
                    <span className="text-[10px] font-mono uppercase text-[var(--text-subtle)]">{t(layer.roleKey, layer.role)}</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1.5">{t(layer.descKey, layer.desc)}</p>
                  </div>
                  {i < ARCH_LAYERS.length - 1 && (
                    <div className="flex items-center justify-center shrink-0 py-0.5 lg:px-1">
                      <ArrowDown className="w-4 h-4 text-[var(--text-subtle)] lg:hidden" />
                      <ArrowRight className="w-4 h-4 text-[var(--text-subtle)] hidden lg:block" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Side services band */}
          <div className="rounded-2xl border border-dashed border-[var(--border-base)] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
              <span className="text-[10px] font-bold uppercase text-[var(--text-subtle)]">{t('liveArchitecture.sideTitle', 'Beside the pipeline (all optional)')}</span>
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SIDE_SERVICES.map(s => (
                <div key={s.titleKey} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-base)]">
                  <s.icon className="w-4 h-4 text-[var(--text-subtle)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-[var(--text-main)]">{t(s.titleKey, s.title)}</div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t(s.descKey, s.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Building blocks */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <CodeXml className="w-5 h-5 text-[var(--sky-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('liveArchitecture.blocksTitle', '2. Building blocks')}</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('liveArchitecture.blocksIntro', 'The parts that make it work, grouped by where each one runs.')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {BLOCK_GROUPS.map(group => (
              <div key={group.titleKey} className="relative rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 pt-5 shadow-xs space-y-3">
                <span className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${ACCENTS[group.accent].dot}`} />
                <div className="flex items-center gap-2">
                  <group.icon className={`w-4 h-4 ${ACCENTS[group.accent].text}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-main)]">{t(group.titleKey, group.title)}</span>
                  <span className="ml-auto text-[10px] font-mono text-[var(--text-subtle)]">{group.blocks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {group.blocks.map(b => (
                    <div key={b.titleKey} className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] space-y-1">
                      <div className="flex items-center gap-2">
                        <b.icon className={`w-3.5 h-3.5 ${ACCENTS[group.accent].text}`} />
                        <h3 className="text-xs font-bold text-[var(--text-main)]">{t(b.titleKey, b.title)}</h3>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t(b.descKey, b.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: How a refresh flows */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-[var(--amber-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('liveArchitecture.flowTitle', '3. How a refresh flows')}</h2>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('liveArchitecture.flowIntro', 'The path every refresh takes.')}
          </p>

          <div
            className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-base)] p-5 overflow-x-auto"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          >
            <div className="relative min-w-[660px]">
              <div className="arch-flow-link-x absolute left-[10%] right-[10%] top-5 h-px -translate-y-1/2" aria-hidden="true" />
              <div
                className="arch-flow-packet-x absolute top-5 z-10 w-2.5 h-2.5 rounded-full bg-[var(--emerald-accent)]"
                style={{ transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px var(--emerald-accent)' }}
                aria-hidden="true"
              />

              <div className="grid grid-cols-5 gap-2">
                {FLOW.map((step, i) => (
                  <div key={step.titleKey} className="flex flex-col items-center text-center">
                    <div
                      className="arch-flow-node relative z-10 w-10 h-10 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--emerald-accent)] flex items-center justify-center"
                      style={{ animationDelay: `${(i * 1.25).toFixed(2)}s` }}
                    >
                      <step.icon className="w-4 h-4 text-[var(--emerald-accent)]" />
                    </div>
                    <div className="mt-3 text-[10px] font-mono font-bold text-[var(--text-subtle)]">0{i + 1}</div>
                    <div className="text-xs font-bold text-[var(--text-main)] leading-tight">{t(step.titleKey, step.title)}</div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">{t(step.descKey, step.desc)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Tech stack */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Braces className="w-5 h-5 text-[var(--indigo-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('liveArchitecture.stackTitle', '4. Tech stack')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STACK_GROUPS.map(group => (
            <div key={group.titleKey} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <group.icon className="w-4 h-4 text-[var(--text-subtle)]" />
                </div>
                <span className="text-sm font-bold text-[var(--text-main)]">{t(group.titleKey, group.title)}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t(group.descKey, group.desc)}</p>
              <div className="flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-[var(--border-subtle)]">
                {group.items.map(item => (
                  'logo' in item && item.logo ? (
                    <TechLogo key={item.name} id={item.logo} slug={item.slug} name={item.name} className={`w-7 h-7 object-contain ${item.mono ? 'dark:invert' : ''}`} />
                  ) : 'icon' in item && item.icon ? (
                    <span key={item.name} title={item.name} aria-label={item.name} className="inline-flex items-center justify-center w-7 h-7">
                      <item.icon className="w-6 h-6 text-[var(--text-subtle)]" />
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Safety & privacy */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('liveArchitecture.section4Title', '5. Safety & privacy')}</h2>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>{t('liveArchitecture.safety1Title', 'GET-only server')}</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">{t('liveArchitecture.safety1Desc', 'Only GET and OPTIONS exist. There are no POST, PUT, DELETE or file-write endpoints anywhere.')}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>{t('liveArchitecture.safety2Title', 'Zero save modification')}</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">{t('liveArchitecture.safety2Desc', 'The mod never writes to disk. Uninstall it and your save is exactly as the game left it.')}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>{t('liveArchitecture.safety3Title', 'Browser friendly')}</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">{t('liveArchitecture.safety3Desc', 'CORS and Private Network Access headers let the app talk to localhost from any modern browser.')}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>{t('liveArchitecture.safety4Title', 'Open source')}</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                {t('liveArchitecture.safety4Desc', 'The full mod source is public on GitHub for anyone to inspect.')}{' '}
                <a href="https://github.com/tiagovitorin/BigAmbitionsCompanion/tree/main/mod/AmbitionProSync" target="_blank" rel="noreferrer" className="text-[var(--emerald-accent)] hover:underline font-mono font-semibold">
                  mod/AmbitionProSync<ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
                </a>
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>{t('liveArchitecture.safety5Title', 'Steam Workshop')}</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                {t('liveArchitecture.safety5Desc', 'Subscribe natively on Steam, no manual file extraction.')}{' '}
                <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072" target="_blank" rel="noreferrer" className="text-[var(--emerald-accent)] hover:underline font-semibold">
                  Big Ambitions Steam Workshop (Item #3793615072)<ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">{t('liveArchitecture.dataBoundaryTitle', 'Where your data goes')}</div>

            <div className="rounded-2xl border border-[var(--border-base)] overflow-hidden">
              <div className="p-4 bg-[var(--emerald-bg)] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--emerald-accent)]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('liveArchitecture.zoneLocalTitle', 'On your machine')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    t('liveArchitecture.zoneLocalState', 'Full game state'),
                    t('liveArchitecture.zoneLocalSettings', 'Settings and cached telemetry'),
                    t('liveArchitecture.zoneLocalKey', 'Your own API key (if you use the AI)')
                  ].map(x => (
                    <span key={x} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-main)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center py-2.5 border-y border-dashed border-[var(--border-base)] bg-[var(--bg-base)]">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">{t('liveArchitecture.zoneBoundary', 'crosses only when you choose')}</span>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                  <Globe className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                  <span>{t('liveArchitecture.zoneCloudTitle', 'To the internet, only on request')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    t('liveArchitecture.zoneCloudAi', 'Uncle Fred prompt to Google, with your key'),
                    t('liveArchitecture.zoneCloudVoice', 'Voice text to the voice service'),
                    t('liveArchitecture.zoneCloudReports', 'Bug or suggestion report to Discord'),
                    t('liveArchitecture.zoneCloudAnalytics', 'Anonymous page stats from Vercel')
                  ].map(x => (
                    <span key={x} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-3.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[var(--emerald-accent)] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[var(--text-main)]">{t('liveArchitecture.neverCollectedTitle', 'Never collected')}</div>
                <p className="leading-relaxed mt-0.5 text-[var(--text-muted)]">{t('liveArchitecture.neverCollectedDesc', 'Your save file name, any account or identity (there is no login), or your game data on our servers.')}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Terminal className="w-4 h-4 text-[var(--sky-accent)]" />
              <span>{t('liveArchitecture.verifyTitle', 'See for yourself')}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t('liveArchitecture.verifyDesc', 'While the game is running, this shows the port is bound only to your local machine:')}</p>
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs space-y-1 select-all">
              <div className="text-[var(--text-muted)] select-none">C:\&gt; netstat -an | findstr 8765</div>
              <div className="text-[var(--emerald-accent)]">  TCP    127.0.0.1:8765         0.0.0.0:0              LISTENING</div>
              <div className="text-[var(--emerald-accent)]">  TCP    [::1]:8765             [::]:0                 LISTENING</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-3.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
              <Tag className="w-3.5 h-3.5 text-[var(--emerald-accent)]" />
              <span>{t('liveArchitecture.releaseTitle', 'Version')}</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] font-bold">{t('liveArchitecture.releaseBuild', 'v2.5.0')}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed text-right">{t('liveArchitecture.releaseDesc', 'The mod reports its version to the app. The Steam Workshop mod (BigAmbitionsCompanionMod.dll) and the MelonLoader standalone (AmbitionProSync.dll) share the same engine and version.')}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
