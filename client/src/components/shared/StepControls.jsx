function StepControls({ currentStep, totalSteps, onPrev, onNext, onPlay, isPlaying }) {
    const pct = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
    return (
        <div className="glass rounded-2xl p-4 space-y-3">
            {/* Progress */}
            <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                    style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
                <button onClick={onPrev} disabled={currentStep === 0 || isPlaying}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-medium transition-all disabled:opacity-30 text-sm">
                    ← Prev
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">{currentStep + 1} / {totalSteps}</span>
                    <button onClick={onPlay}
                        className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${isPlaying
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                : 'bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30'
                            }`}>
                        {isPlaying ? '⏸ Pause' : '▶ Auto Play'}
                    </button>
                </div>

                <button onClick={onNext} disabled={currentStep === totalSteps - 1 || isPlaying}
                    className="btn-primary text-sm py-2 px-4 disabled:opacity-30">
                    Next →
                </button>
            </div>
        </div>
    );
}

export default StepControls;
