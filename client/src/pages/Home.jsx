import { Link } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext'

const MODULES = [
    { id: 'sorting', label: 'Sorting Algorithms', icon: '🔄', color: 'from-blue-500 to-indigo-600', glow: 'rgba(99,102,241,0.35)', levels: 6, tag: 'Beginner', desc: 'Bubble Sort, Selection Sort, Algorithm Race and a Custom Sandbox mode.' },
    { id: 'stack-queue', label: 'Stack & Queue', icon: '📚', color: 'from-purple-500 to-pink-600', glow: 'rgba(217,70,239,0.35)', levels: 4, tag: 'Beginner', desc: 'Interactive push/pop and enqueue/dequeue with overflow & underflow guards.' },
    { id: 'trees', label: 'Tree Basics', icon: '🌳', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.35)', levels: 4, tag: 'Intermediate', desc: 'Build a BST dynamically and explore all three traversal algorithms.' },
    { id: 'linked-list', label: 'Linked Lists', icon: '🔗', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.35)', levels: 4, tag: 'Intermediate', desc: 'Insert at any position, delete, search — plus code fill-in challenges.' },
]

const FEATURES = [
    { icon: '🎨', title: 'Visual Animations', desc: 'Watch algorithms execute step-by-step with color-coded animated bars, blocks and SVG trees.' },
    { icon: '📝', title: 'Synced Pseudocode', desc: 'Every step highlights the exact pseudocode line that is executing — learn logic, not memorization.' },
    { icon: '🎯', title: 'Hands-On Practice', desc: 'Drag, click, push, pop, and insert — you perform the algorithm, the platform validates each move.' },
    { icon: '📊', title: 'Quiz & Score', desc: 'Earn stars based on your quiz score. Progress is saved so you can continue anytime.' },
]

export default function Home() {
    const { getModuleProgress } = useProgress()

    return (
        <div className="min-h-screen bg-dark-950">
            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid pt-16">
                {/* ambient blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #667eea, transparent)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />

                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-slate-300 mb-8 animate-fade-in"
                        style={{ animationDelay: '0.1s' }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Minor Project — Computer Science
                    </div>

                    <h1 className="font-display text-6xl md:text-8xl font-black text-white leading-tight mb-6 animate-slide-up"
                        style={{ animationDelay: '0.2s' }}>
                        Learn DSA
                        <br />
                        <span className="gradient-text">Through Gaming</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in"
                        style={{ animationDelay: '0.4s' }}>
                        Master Data Structures & Algorithms through stunning animations,
                        step-by-step pseudocode, and hands-on interactive challenges.
                    </p>

                    <div className="flex gap-4 justify-center flex-wrap animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <Link to="/modules" className="btn-primary text-base px-8 py-4">
                            Start Learning 🚀
                        </Link>
                        <Link to="/modules" className="btn-ghost text-base px-8 py-4">
                            View Modules
                        </Link>
                    </div>

                    {/* Floating emoji orbs */}
                    <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
                        {[['🔄', '-top-8', 'left-16'], ['📚', 'top-24', 'right-8'], ['🌳', 'bottom-16', 'left-8'], ['⚡', 'bottom-8', 'right-24']].map(([e, t, l]) => (
                            <span key={e} className="absolute text-4xl opacity-20 animate-float"
                                style={{ top: t.startsWith('bottom') ? undefined : t.replace('-', ''), bottom: t.startsWith('bottom') ? t.replace('bottom-', '') : undefined, left: l.startsWith('left') ? l.replace('left-', '') : undefined, right: l.startsWith('right') ? l.replace('right-', '') : undefined, animationDelay: `${Math.random() * 2}s` }}>
                                {e}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="relative py-16 px-4" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[['4', 'Modules'], ['18', 'Levels'], ['40', 'Quiz Questions'], ['100%', 'Free']].map(([n, l]) => (
                        <div key={l}>
                            <div className="font-display text-4xl font-black gradient-text mb-1">{n}</div>
                            <div className="text-slate-500 text-sm">{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── MODULES ── */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center mb-16">
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Learning Modules</h2>
                    <p className="text-slate-400 text-lg">Choose a module — each one is a self-contained game-like journey</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {MODULES.map((m, i) => {
                        const pct = getModuleProgress(m.id, m.levels)
                        return (
                            <Link key={m.id} to={`/module/${m.id}/level/1`}
                                className="group relative glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
                                style={{ '--glow': m.glow }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 20px 60px ${m.glow}`)}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                            >
                                {/* gradient header bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color} rounded-t-2xl`} />

                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl shadow-lg`}>
                                        {m.icon}
                                    </div>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full border border-white/10 text-slate-400">
                                        {m.tag}
                                    </span>
                                </div>

                                <h3 className="font-display text-xl font-bold text-white mb-2">{m.label}</h3>
                                <p className="text-slate-400 text-sm mb-5 leading-relaxed">{m.desc}</p>

                                <div className="mb-1 flex justify-between text-xs text-slate-500">
                                    <span>{m.levels} levels</span>
                                    <span>{pct}% done</span>
                                </div>
                                <div className="w-full rounded-full h-1.5 bg-white/10 mb-5">
                                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>

                                <div className={`text-center py-2.5 rounded-xl bg-gradient-to-r ${m.color} text-white text-sm font-bold group-hover:shadow-lg transition-all`}>
                                    {pct > 0 ? 'Continue →' : 'Start Learning →'}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-24 px-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-white text-center mb-4">How It Works</h2>
                    <p className="text-slate-400 text-center mb-16 text-lg">4 levels per module — each one builds on the last</p>
                    <div className="grid md:grid-cols-4 gap-4">
                        {FEATURES.map((f, i) => (
                            <div key={f.title} className="glass rounded-2xl p-6 text-center group hover:border-primary-500/30 transition-all">
                                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
                                    style={{ background: 'rgba(102,126,234,0.15)', border: '1px solid rgba(102,126,234,0.3)' }}>
                                    {f.icon}
                                </div>
                                <div className="text-xs font-bold text-primary-400 mb-1">LEVEL {i + 1}</div>
                                <h3 className="font-display font-bold text-white mb-2">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(102,126,234,0.15) 0%, transparent 70%)' }} />
                <div className="relative max-w-2xl mx-auto">
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                        Ready to Conquer<br /><span className="gradient-text">Data Structures?</span>
                    </h2>
                    <p className="text-slate-400 mb-8 text-lg">4 modules. 18 levels. 40 quiz questions. Let's go.</p>
                    <Link to="/modules" className="btn-primary text-lg px-12 py-4 animate-pulse-glow">
                        Begin Your Journey 🎮
                    </Link>
                </div>
            </section>
        </div>
    )
}
