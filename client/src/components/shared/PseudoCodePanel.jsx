function PseudoCodePanel({ lines = [], currentStep = -1, title = 'algorithm.py' }) {
    return (
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                    <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <span className="text-slate-500 text-xs font-mono ml-2">{title}</span>
            </div>
            {/* Code */}
            <div className="p-4 font-mono text-sm space-y-0.5">
                {lines.map((line, i) => (
                    <div key={i}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-3 transition-all duration-300 ${i === currentStep
                                ? 'text-white scale-[1.02]'
                                : 'text-slate-500'
                            }`}
                        style={i === currentStep ? { background: 'rgba(102,126,234,0.25)', borderLeft: '3px solid #667eea' } : {}}>
                        <span className="text-slate-700 select-none w-4 text-right shrink-0">{i + 1}</span>
                        <span>{line}</span>
                        {i === currentStep && <span className="ml-auto text-primary-400 text-xs">← executing</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PseudoCodePanel;
