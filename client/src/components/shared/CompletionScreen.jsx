import { Link } from 'react-router-dom';

function CompletionScreen({ score, total, moduleId, nextLevelId, onRetry }) {
    const pct = total ? Math.round((score / total) * 100) : 100;
    const stars = pct >= 80 ? 3 : pct >= 60 ? 2 : 1;

    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="relative inline-block mb-6">
                <div className="text-7xl animate-float">{'⭐'.repeat(stars)}</div>
            </div>
            <h2 className="font-display text-4xl font-black text-white mb-3">Level Complete!</h2>
            {total > 0 && (
                <p className="text-2xl text-slate-300 mb-8">
                    Score: <span className="gradient-text font-black text-4xl">{score}/{total}</span>
                </p>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={onRetry}
                    className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-semibold transition-all">
                    🔁 Try Again
                </button>
                {nextLevelId && (
                    <Link to={`/module/${moduleId}/level/${nextLevelId}`} className="btn-primary px-8 py-3 text-base">
                        Next Level →
                    </Link>
                )}
                <Link to="/modules" className="btn-ghost px-8 py-3 text-base">
                    All Modules
                </Link>
            </div>
        </div>
    );
}

export default CompletionScreen;
