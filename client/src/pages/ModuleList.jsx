import { Link } from 'react-router-dom'
import { useProgress } from '../context/ProgressContext'

const MODULES = [
    { id: 'sorting', label: 'Sorting Algorithms', icon: '🔄', color: 'from-blue-500 to-indigo-600', glow: 'rgba(99,102,241,0.3)', levels: 6, tag: 'Beginner', desc: 'Bubble Sort, Selection Sort, Algorithm Race, and a Custom Sandbox.' },
    { id: 'stack-queue', label: 'Stack & Queue', icon: '📚', color: 'from-purple-500 to-pink-600', glow: 'rgba(217,70,239,0.3)', levels: 4, tag: 'Beginner', desc: 'Interactive push/pop and enqueue/dequeue with LIFO & FIFO logic.' },
    { id: 'trees', label: 'Tree Basics', icon: '🌳', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.3)', levels: 4, tag: 'Intermediate', desc: 'Build a BST and explore all three traversal algorithms.' },
    { id: 'linked-list', label: 'Linked Lists', icon: '🔗', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.3)', levels: 4, tag: 'Intermediate', desc: 'Insert, delete, search nodes. Study types and fill-in pseudocode.' },
]

const LEVEL_ICONS = { 1: '👁️', 2: '🎯', 3: '🏋️', 4: '📊', 5: '⚡', 6: '🔧' }
const LEVEL_LABELS = { 1: 'Concept', 2: 'Interactive', 3: 'Practice', 4: 'Quiz/Deep', 5: 'Race', 6: 'Sandbox' }

export default function ModuleList() {
    const { isCompleted, getModuleProgress } = useProgress()

    return (
        <div className="min-h-screen bg-dark-950 bg-grid pt-24 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-14">
                    <h1 className="font-display text-5xl font-black text-white mb-3">📚 Learning Modules</h1>
                    <p className="text-slate-400 text-lg">Complete each level in order to unlock the next. 18 levels total across 4 modules.</p>
                </div>

                <div className="space-y-6">
                    {MODULES.map(m => {
                        const pct = getModuleProgress(m.id, m.levels)
                        return (
                            <div key={m.id} className="glass rounded-2xl p-6 transition-all duration-300"
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 40px ${m.glow}`)}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                                <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl shadow-lg shrink-0`}>{m.icon}</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="font-display text-2xl font-bold text-white">{m.label}</h2>
                                                <span className="text-xs px-2.5 py-0.5 rounded-full border border-white/10 text-slate-400">{m.tag}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-500">{m.levels} levels</span>
                                            </div>
                                            <p className="text-slate-400 text-sm">{m.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-display text-3xl font-black bg-gradient-to-r ${m.color} bg-clip-text text-transparent`}>{pct}%</div>
                                        <div className="text-slate-500 text-xs">Complete</div>
                                    </div>
                                </div>

                                <div className="w-full bg-white/5 rounded-full h-1.5 mb-5 overflow-hidden">
                                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                </div>

                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {Array.from({ length: m.levels }, (_, i) => i + 1).map(lvl => {
                                        const completed = isCompleted(m.id, lvl)
                                        const unlocked = lvl === 1 || isCompleted(m.id, lvl - 1)
                                        return (
                                            <Link key={lvl}
                                                to={unlocked ? `/module/${m.id}/level/${lvl}` : '#'}
                                                onClick={e => !unlocked && e.preventDefault()}
                                                className={`relative p-3 rounded-xl border text-center transition-all duration-300 ${completed ? 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-400/60' :
                                                        unlocked ? 'border-white/10 bg-white/5 hover:border-primary-400/50 hover:bg-primary-500/10 hover:-translate-y-1 cursor-pointer' :
                                                            'border-white/5 bg-white/2 opacity-35 cursor-not-allowed'
                                                    }`}>
                                                {!unlocked && <div className="absolute inset-0 flex items-center justify-center rounded-xl text-xl">🔒</div>}
                                                <div className="text-xl mb-0.5">{completed ? '✅' : LEVEL_ICONS[lvl]}</div>
                                                <div className="text-xs font-bold text-white">L{lvl}</div>
                                                <div className="text-xs text-slate-600 leading-tight">{LEVEL_LABELS[lvl]}</div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
