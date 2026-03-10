import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useProgress } from '../../context/ProgressContext'

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const loc = useLocation()
    const { xp, getLevel } = useProgress()
    const { level, title } = getLevel()

    const links = [
        { to: '/', label: 'Home' },
        { to: '/modules', label: 'Modules' },
        { to: '/dashboard', label: '🏆 Dashboard' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50"
            style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', boxShadow: '0 4px 15px rgba(102,126,234,0.4)' }}>
                            🎮
                        </div>
                        <span className="font-display font-bold text-lg text-white group-hover:text-primary-300 transition-colors">
                            DSA <span className="gradient-text">Gaming</span>
                        </span>
                    </Link>

                    {/* Desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(l => (
                            <Link key={l.to} to={l.to}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${loc.pathname === l.to
                                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    {/* XP chip */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/dashboard"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:border-yellow-400/40"
                            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <span className="text-yellow-400 font-bold text-sm">⚡ {xp} XP</span>
                            <span className="text-slate-500 text-xs">Lv.{level} {title}</span>
                        </Link>
                    </div>

                    <button onClick={() => setOpen(o => !o)} className="md:hidden text-slate-400 hover:text-white p-2">
                        {open ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {open && (
                <div className="md:hidden px-4 pb-4 pt-1 space-y-1" style={{ background: 'rgba(10,10,15,0.97)' }}>
                    {links.map(l => (
                        <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                            className="block px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 font-medium transition-all">
                            {l.label}
                        </Link>
                    ))}
                    <div className="px-4 py-2 text-yellow-400 text-sm font-bold">⚡ {xp} XP — Level {level}</div>
                </div>
            )}
        </nav>
    )
}
