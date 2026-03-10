import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            className="py-12 px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>🎮</div>
                        <span className="font-display font-bold text-white">DSA Gaming</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Making Data Structures & Algorithms visual, interactive, and actually fun.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Navigate</h4>
                    <ul className="space-y-2">
                        {[['/', 'Home'], ['/modules', 'Modules']].map(([to, label]) => (
                            <li key={to}><Link to={to} className="text-slate-500 hover:text-primary-400 text-sm transition-colors">{label}</Link></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Modules</h4>
                    <ul className="space-y-2">
                        {[['sorting', '🔄 Sorting'], ['stack-queue', '📚 Stack & Queue'], ['trees', '🌳 Trees']].map(([id, label]) => (
                            <li key={id}><Link to={`/module/${id}/level/1`} className="text-slate-500 hover:text-primary-400 text-sm transition-colors">{label}</Link></li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="text-center text-slate-600 text-xs mt-10 pt-6 border-t border-white/5">
                © 2026 DSA with Gaming — Minor Project
            </div>
        </footer>
    )
}
