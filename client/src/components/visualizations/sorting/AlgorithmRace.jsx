import { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../../context/ProgressContext';
import CompletionScreen from '../../shared/CompletionScreen';

const BAR_COLORS = {
    default: '#334155',
    comparing: '#f59e0b',
    swapping: '#ef4444',
    sorted: '#10b981',
};

function generateBubbleSteps(arr) {
    const steps = []; const a = [...arr]; const sorted = new Set();
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length - i - 1; j++) {
            steps.push({ arr: [...a], comparing: [j, j + 1], swapping: [], sorted: new Set(sorted) });
            if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; steps.push({ arr: [...a], comparing: [], swapping: [j, j + 1], sorted: new Set(sorted) }); }
        }
        sorted.add(a.length - 1 - i);
    }
    steps.push({ arr: [...a], comparing: [], swapping: [], sorted: new Set([...Array(a.length).keys()]) });
    return steps;
}

function generateSelectionSteps(arr) {
    const steps = []; const a = [...arr]; const sorted = new Set();
    for (let i = 0; i < a.length - 1; i++) {
        let minIdx = i;
        steps.push({ arr: [...a], comparing: [i], swapping: [], sorted: new Set(sorted), minIdx });
        for (let j = i + 1; j < a.length; j++) {
            steps.push({ arr: [...a], comparing: [j], swapping: [], sorted: new Set(sorted), minIdx });
            if (a[j] < a[minIdx]) { minIdx = j; steps.push({ arr: [...a], comparing: [j], swapping: [], sorted: new Set(sorted), minIdx }); }
        }
        if (minIdx !== i) { [a[i], a[minIdx]] = [a[minIdx], a[i]]; steps.push({ arr: [...a], comparing: [], swapping: [i, minIdx], sorted: new Set(sorted), minIdx: i }); }
        sorted.add(i);
        steps.push({ arr: [...a], comparing: [], swapping: [], sorted: new Set(sorted), minIdx: -1 });
    }
    sorted.add(a.length - 1);
    steps.push({ arr: [...a], comparing: [], swapping: [], sorted: new Set([...Array(a.length).keys()]), minIdx: -1 });
    return steps;
}

function AlgorithmBars({ step, maxVal, label, color, stepNum, totalSteps }) {
    const getColor = (i) => {
        if (!step) return BAR_COLORS.default;
        if (step.sorted?.has(i)) return BAR_COLORS.sorted;
        if (step.swapping?.includes(i)) return BAR_COLORS.swapping;
        if (step.comparing?.includes(i)) return color;
        return BAR_COLORS.default;
    };
    return (
        <div className="flex-1 glass rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-display font-bold text-white text-sm">{label}</h3>
                <span className="text-xs text-slate-500">Step {stepNum}/{totalSteps}</span>
            </div>
            <div className="flex items-end justify-center gap-1.5 h-36">
                {step?.arr.map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-bold" style={{ color: getColor(i) }}>{val}</span>
                        <div className="w-8 rounded-t-md transition-all duration-300" style={{ height: `${(val / maxVal) * 120}px`, background: getColor(i) }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AlgorithmRace({ moduleId = 'sorting', levelId = 5 }) {
    const INITIAL = [64, 34, 25, 12, 22, 11, 90];
    const bubbleSteps = generateBubbleSteps(INITIAL);
    const selectionSteps = generateSelectionSteps(INITIAL);
    const maxLen = Math.max(bubbleSteps.length, selectionSteps.length);
    const maxVal = Math.max(...INITIAL);

    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [done, setDone] = useState(false);
    const [winner, setWinner] = useState(null);
    const intervalRef = useRef(null);
    const { markComplete } = useProgress();

    const bStep = bubbleSteps[Math.min(stepIdx, bubbleSteps.length - 1)];
    const sStep = selectionSteps[Math.min(stepIdx, selectionSteps.length - 1)];

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setStepIdx(prev => {
                    const next = prev + 1;
                    if (next >= maxLen) {
                        setIsPlaying(false);
                        const bDone = bubbleSteps.length;
                        const sDone = selectionSteps.length;
                        setWinner(bDone < sDone ? 'bubble' : sDone < bDone ? 'selection' : 'tie');
                        setDone(true);
                        markComplete(moduleId, levelId);
                        return maxLen - 1;
                    }
                    return next;
                });
            }, speed);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, speed]);

    if (done && winner) return (
        <div className="text-center py-12 animate-fade-in">
            <div className="text-7xl mb-4">{winner === 'tie' ? '🤝' : '🏆'}</div>
            <h2 className="font-display text-3xl font-black text-white mb-4">
                {winner === 'bubble' ? 'Bubble Sort Wins!' : winner === 'selection' ? 'Selection Sort Wins!' : "It's a Tie!"}
            </h2>
            <div className="flex justify-center gap-4 mb-8">
                {[['🫧 Bubble Sort', bubbleSteps.length, '#667eea'], ['🔍 Selection Sort', selectionSteps.length, '#f59e0b']].map(([l, s, c]) => (
                    <div key={l} className="glass rounded-2xl px-6 py-4 text-center">
                        <div className="text-white font-bold">{l}</div>
                        <div className="text-2xl font-black" style={{ color: c }}>{s}</div>
                        <div className="text-slate-500 text-xs">steps</div>
                    </div>
                ))}
            </div>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">Both algorithms have O(n²) complexity, but Selection Sort makes fewer swaps while Bubble Sort can terminate early!</p>
            <button onClick={() => { setStepIdx(0); setDone(false); setWinner(null); }} className="btn-primary px-8 py-3">🔄 Race Again</button>
        </div>
    );

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="glass rounded-2xl p-4">
                <h3 className="font-display text-center text-white font-bold mb-1">⚡ Algorithm Race</h3>
                <p className="text-slate-400 text-center text-sm">Both algorithms sort the same array simultaneously. Who finishes first?</p>
            </div>

            <div className="flex gap-3">
                <AlgorithmBars step={bStep} maxVal={maxVal} label="🫧 Bubble Sort" color={BAR_COLORS.comparing} stepNum={Math.min(stepIdx + 1, bubbleSteps.length)} totalSteps={bubbleSteps.length} />
                <AlgorithmBars step={sStep} maxVal={maxVal} label="🔍 Selection Sort" color="#f59e0b" stepNum={Math.min(stepIdx + 1, selectionSteps.length)} totalSteps={selectionSteps.length} />
            </div>

            {/* Progress bars */}
            <div className="space-y-2 glass rounded-xl p-4">
                {[['🫧 Bubble', bubbleSteps.length, '#667eea'], ['🔍 Selection', selectionSteps.length, '#f59e0b']].map(([lbl, total, color]) => (
                    <div key={lbl} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-24 shrink-0">{lbl}</span>
                        <div className="flex-1 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${(Math.min(stepIdx, total - 1) / Math.max(total - 1, 1)) * 100}%`, background: color }} />
                        </div>
                        <span className="text-xs font-mono text-slate-500 w-16 text-right">{Math.min(stepIdx + 1, total)}/{total}</span>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Speed:</span>
                    {[[800, 'Slow'], [500, 'Normal'], [200, 'Fast'], [50, 'Ludicrous']].map(([s, l]) => (
                        <button key={l} onClick={() => setSpeed(s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${speed === s ? 'border-primary-400 bg-primary-500/20 text-primary-300' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} disabled={isPlaying}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm disabled:opacity-30">← Prev</button>
                    <button onClick={() => setIsPlaying(p => !p)} className="btn-primary text-sm px-5 py-2">
                        {isPlaying ? '⏸ Pause' : stepIdx >= maxLen - 1 ? '🔄 Restart' : '▶ Race!'}
                    </button>
                    <button onClick={() => setStepIdx(s => Math.min(maxLen - 1, s + 1))} disabled={isPlaying}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-30">Next →</button>
                </div>
            </div>
        </div>
    );
}
