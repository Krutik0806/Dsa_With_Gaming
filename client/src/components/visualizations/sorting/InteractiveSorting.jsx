import { useState, useEffect, useRef } from 'react';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const DIFFICULTIES = {
    easy: { label: 'Easy', color: '#10b981', arr: [5, 3, 8, 1, 9, 2, 7], timeLimit: 90, moves: 20 },
    medium: { label: 'Medium', color: '#f59e0b', arr: [64, 34, 25, 12, 22, 11, 90], timeLimit: 60, moves: 12 },
    hard: { label: 'Hard', color: '#ef4444', arr: [99, 1, 56, 23, 78, 4, 45, 12], timeLimit: 45, moves: 10 },
};

export default function InteractiveSorting({ moduleId = 'sorting', levelId = 2 }) {
    const [difficulty, setDifficulty] = useState(null);
    const [arr, setArr] = useState([]);
    const [original, setOriginal] = useState([]);
    const [selected, setSelected] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [feedbackType, setFeedbackType] = useState('info');
    const [moves, setMoves] = useState(0);
    const [done, setDone] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timeUp, setTimeUp] = useState(false);
    const timerRef = useRef(null);
    const { markComplete } = useProgress();

    const startGame = (diff) => {
        const d = DIFFICULTIES[diff];
        setDifficulty(diff);
        setArr([...d.arr]);
        setOriginal([...d.arr]);
        setTimeLeft(d.timeLimit);
        setMoves(0);
        setSelected([]);
        setFeedback('👆 Click two bars to swap them into sorted order!');
        setFeedbackType('info');
        setDone(false);
        setTimeUp(false);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current); setTimeUp(true); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    const isSorted = (a) => a.every((v, i) => i === 0 || v >= a[i - 1]);
    const maxVal = arr.length ? Math.max(...arr) : 1;

    const handleClick = (idx) => {
        if (done || timeUp) return;
        if (selected.length === 0) {
            setSelected([idx]);
            setFeedback(`Selected ${arr[idx]}. Pick another to swap.`);
            setFeedbackType('info');
        } else if (selected[0] !== idx) {
            const [a, b] = [selected[0], idx];
            const newArr = [...arr];
            [newArr[a], newArr[b]] = [newArr[b], newArr[a]];
            setArr(newArr);
            setMoves(m => m + 1);
            setSelected([]);
            if (isSorted(newArr)) {
                clearInterval(timerRef.current);
                setDone(true);
                const d = DIFFICULTIES[difficulty];
                const isFast = moves + 1 <= d.moves;
                markComplete(moduleId, levelId, 0, false, isFast);
                setFeedback('🎉 Sorted!');
                setFeedbackType('success');
            } else {
                setFeedback(`Swapped → ${newArr.join(', ')}`);
                setFeedbackType(arr[a] > arr[b] ? 'success' : 'warning');
            }
        }
    };

    const reset = () => startGame(difficulty);

    /* ── PICK DIFFICULTY ── */
    if (!difficulty) return (
        <div className="text-center py-8 animate-fade-in">
            <h3 className="font-display text-2xl font-bold text-white mb-2">🎯 Choose Difficulty</h3>
            <p className="text-slate-400 mb-8">Sort the array by clicking two bars to swap them. Harder = more elements, less time!</p>
            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {Object.entries(DIFFICULTIES).map(([key, d]) => (
                    <button key={key} onClick={() => startGame(key)}
                        className="glass rounded-2xl p-6 text-center hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                        style={{ borderColor: d.color + '44' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 10px 40px ${d.color}44`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                        <div className="text-4xl mb-2">{key === 'easy' ? '🟢' : key === 'medium' ? '🟡' : '🔴'}</div>
                        <div className="font-display font-bold text-white text-lg">{d.label}</div>
                        <div className="text-slate-500 text-xs mt-2">{d.arr.length} elements</div>
                        <div className="text-slate-500 text-xs">⏱ {d.timeLimit}s</div>
                        <div className="text-slate-500 text-xs">Target: {d.moves} moves</div>
                    </button>
                ))}
            </div>
        </div>
    );

    const d = DIFFICULTIES[difficulty];
    const timeColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981';

    /* ── TIMEOUT ── */
    if (timeUp && !done) return (
        <div className="text-center py-12 animate-fade-in">
            <div className="text-7xl mb-4">⏰</div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Time's Up!</h2>
            <p className="text-slate-400 mb-6">You ran out of time. Try a slower difficulty or practice more!</p>
            <div className="flex justify-center gap-4 flex-wrap">
                <button onClick={reset} className="btn-primary px-8 py-3">🔄 Retry</button>
                <button onClick={() => setDifficulty(null)} className="btn-ghost px-8 py-3">Change Difficulty</button>
            </div>
        </div>
    );

    if (done) return (
        <div className="text-center py-12 animate-fade-in">
            <div className="text-7xl mb-4 animate-float">🏆</div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Array Sorted!</h2>
            <p className="text-slate-400 mb-2">Completed in <strong className="text-white">{moves} moves</strong></p>
            {moves <= d.moves && <p className="text-yellow-400 font-bold mb-2">⚡ Under target! Speed Demon unlocked!</p>}
            <div className="flex justify-center gap-4 mt-6 flex-wrap">
                <button onClick={reset} className="btn-ghost px-8 py-3">🔄 Retry</button>
                <button onClick={() => setDifficulty(null)} className="btn-ghost px-8 py-3">Change Difficulty</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* HUD */}
            <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Moves:</span>
                    <span className="font-bold text-white">{moves}</span>
                    <span className="text-slate-600 text-xs">/ target {d.moves}</span>
                </div>
                <div className="font-mono font-bold text-xl" style={{ color: timeColor }}>{timeLeft}s</div>
                <div className="flex gap-2">
                    <button onClick={reset} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white">Reset</button>
                    <button onClick={() => setDifficulty(null)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white">Change</button>
                </div>
            </div>

            {/* Timer bar */}
            <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / d.timeLimit) * 100}%`, background: timeColor }} />
            </div>

            {/* Bars */}
            <div className="rounded-2xl p-6 flex items-end justify-center gap-2 min-h-[200px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {arr.map((val, i) => (
                    <button key={i} onClick={() => handleClick(i)} className="flex flex-col items-center gap-1 group cursor-pointer">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{val}</span>
                        <div className="rounded-t-lg w-10 transition-all duration-300 group-hover:opacity-70"
                            style={{
                                height: `${(val / maxVal) * 160}px`,
                                background: selected.includes(i) ? '#f59e0b' : isSorted(arr) ? '#10b981' : d.color,
                                boxShadow: selected.includes(i) ? '0 0 20px rgba(245,158,11,0.6)' : 'none',
                            }}
                        />
                    </button>
                ))}
            </div>

            {feedback && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium text-center ${feedbackType === 'success' ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                        feedbackType === 'warning' ? 'border border-yellow-500/40 bg-yellow-500/10 text-yellow-300' :
                            'border border-white/10 bg-white/5 text-slate-300'
                    }`}>{feedback}</div>
            )}
        </div>
    );
}
