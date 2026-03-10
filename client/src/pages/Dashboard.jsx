import { useProgress } from '../context/ProgressContext'
import { Link } from 'react-router-dom'

const MODULES = [
    { id: 'sorting', label: 'Sorting', icon: '🔄', color: 'from-blue-500 to-indigo-600', levels: 4 },
    { id: 'stack-queue', label: 'Stack/Queue', icon: '📚', color: 'from-purple-500 to-pink-600', levels: 4 },
    { id: 'trees', label: 'Trees', icon: '🌳', color: 'from-emerald-500 to-teal-600', levels: 4 },
]

const LEVEL_LABELS = { 1: 'Concept', 2: 'Interactive', 3: 'Practice', 4: 'Quiz' }

export default function Dashboard() {
    const { xp, achievements, streak, getLevel, getModuleProgress, isCompleted, ACHIEVEMENTS } = useProgress()
    const { level, title, next } = getLevel()
    const prevXP = { 1: 0, 2: 100, 3: 300, 4: 600, 5: 1000 }
    const xpMin = prevXP[level]
    const xpMax = next === Infinity ? xp : next
    const xpPct = next === Infinity ? 100 : Math.min(100, ((xp - xpMin) / (xpMax - xpMin)) * 100)
    const totalLevels = 12
    const completedLevels = MODULES.reduce((acc, m) => acc + [1, 2, 3, 4].filter(l => isCompleted(m.id, l)).length, 0)

    return (
        <div className="min-h-screen bg-dark-950 bg-grid pt-24 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-display text-5xl font-black text-white mb-2">🏆 Your Dashboard</h1>
                    <p className="text-slate-400">Track your XP, achievements and progress</p>
                </div>

                {/* XP Card */}
                <div className="glass rounded-2xl p-8 mb-6 overflow-hidden relative">
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.1), transparent 60%)' }} />
                    <div className="flex items-center justify-between flex-wrap gap-6">
                        <div>
                            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Current Rank</div>
                            <div className="font-display text-4xl font-black text-white">Level {level}</div>
                            <div className="text-yellow-400 font-bold text-lg">{title}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-display text-5xl font-black gradient-text-gold">{xp}</div>
                            <div className="text-slate-400 text-sm">Total XP</div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                            <span>{xpMin} XP</span>
                            <span>{next === Infinity ? 'MAX LEVEL' : `${next} XP to Level ${level + 1}`}</span>
                        </div>
                        <div className="w-full rounded-full h-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { icon: '📊', label: 'Levels Done', value: `${completedLevels}/${totalLevels}` },
                        { icon: '🏅', label: 'Achievements', value: `${achievements.length}/${ACHIEVEMENTS.length}` },
                        { icon: '🔥', label: 'Day Streak', value: `${streak.count} day${streak.count !== 1 ? 's' : ''}` },
                    ].map(s => (
                        <div key={s.label} className="glass rounded-2xl p-5 text-center">
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <div className="font-display font-bold text-white text-xl">{s.value}</div>
                            <div className="text-slate-500 text-xs">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Module progress */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">📚 Module Progress</h2>
                        <div className="space-y-5">
                            {MODULES.map(m => {
                                const pct = getModuleProgress(m.id, m.levels)
                                return (
                                    <div key={m.id}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{m.icon}</span>
                                                <span className="font-semibold text-white text-sm">{m.label}</span>
                                            </div>
                                            <span className="text-slate-400 text-xs">{pct}%</span>
                                        </div>
                                        <div className="w-full rounded-full h-2 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                            <div className={`h-2 rounded-full bg-gradient-to-r ${m.color} transition-all`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4].map(l => {
                                                const done = isCompleted(m.id, l)
                                                return (
                                                    <Link key={l} to={`/module/${m.id}/level/${l}`}
                                                        className={`flex-1 text-center text-xs py-1 rounded-lg border transition-all ${done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-slate-600'}`}>
                                                        {done ? '✓' : `L${l}`}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">🏅 Achievements</h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {ACHIEVEMENTS.map(a => {
                                const unlocked = achievements.includes(a.id)
                                return (
                                    <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${unlocked ? 'border-yellow-500/30 bg-yellow-500/8' : 'border-white/5 bg-white/2 opacity-40'
                                        }`}>
                                        <span className={`text-2xl ${!unlocked ? 'grayscale' : ''}`}>{a.icon}</span>
                                        <div className="flex-1">
                                            <div className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-slate-600'}`}>{a.title}</div>
                                            <div className="text-slate-500 text-xs">{a.desc}</div>
                                        </div>
                                        <div className={`text-xs font-bold ${unlocked ? 'text-yellow-400' : 'text-slate-700'}`}>+{a.xp} XP</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/modules" className="btn-primary text-base px-10 py-4">
                        Continue Learning →
                    </Link>
                </div>
            </div>
        </div>
    )
}
