import { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../../context/ProgressContext';

const ALGORITHMS = {
    bubble: { label: 'Bubble Sort 🫧', color: '#667eea' },
    selection: { label: 'Selection Sort 🔍', color: '#f59e0b' },
};

function sortBubble(arr) {
    const steps = []; const a = [...arr]; const sorted = new Set();
    for (let i = 0; i < a.length; i++) {
        let swapped = false;
        for (let j = 0; j < a.length - i - 1; j++) {
            steps.push({ arr: [...a], hi: [j, j + 1], sorted: new Set(sorted) });
            if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true; steps.push({ arr: [...a], hi: [j, j + 1], sorted: new Set(sorted) }); }
        }
        sorted.add(a.length - 1 - i);
        if (!swapped) break;
    }
    steps.push({ arr: [...a], hi: [], sorted: new Set([...Array(a.length).keys()]) });
    return steps;
}

function sortSelection(arr) {
    const steps = []; const a = [...arr]; const sorted = new Set();
    for (let i = 0; i < a.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < a.length; j++) { steps.push({ arr: [...a], hi: [j, min], sorted: new Set(sorted) }); if (a[j] < a[min]) min = j; }
        if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; steps.push({ arr: [...a], hi: [i, min], sorted: new Set(sorted) }); }
        sorted.add(i);
    }
    sorted.add(a.length - 1);
    steps.push({ arr: [...a], hi: [], sorted: new Set([...Array(a.length).keys()]) });
    return steps;
}

export default function SortingSandbox({ moduleId = 'sorting', levelId = 6 }) {
    const [inputVal, setInputVal] = useState('38, 27, 43, 3, 9, 82, 10');
    const [algorithm, setAlgorithm] = useState('bubble');
    const [steps, setSteps] = useState([]);
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(400);
    const [error, setError] = useState('');
    const [runs, setRuns] = useState(0);
    const [done, setDone] = useState(false);
    const intervalRef = useRef(null);
    const { markComplete } = useProgress();

    const parseArr = (str) => {
        const nums = str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= 999);
        return nums;
    };

    const build = () => {
        const arr = parseArr(inputVal);
        if (arr.length < 2) { setError('Enter at least 2 valid numbers (1-999), separated by commas.'); return; }
        if (arr.length > 12) { setError('Max 12 numbers for best visualization!'); return; }
        setError('');
        const s = algorithm === 'bubble' ? sortBubble(arr) : sortSelection(arr);
        setSteps(s);
        setStepIdx(0);
        setIsPlaying(false);
        clearInterval(intervalRef.current);
    };

    useEffect(() => { build(); }, [algorithm]);

    useEffect(() => {
        if (isPlaying && steps.length > 0) {
            intervalRef.current = setInterval(() => {
                setStepIdx(prev => {
                    if (prev >= steps.length - 1) {
                        setIsPlaying(false);
                        setRuns(r => {
                            const nr = r + 1;
                            if (nr >= 2 && !done) { setDone(true); markComplete(moduleId, levelId); }
                            return nr;
                        });
                        return steps.length - 1;
                    }
                    return prev + 1;
                });
            }, speed);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, speed, steps]);

    const step = steps[stepIdx];
    const maxVal = step ? Math.max(...step.arr, 1) : 1;

    const getColor = (i, algo) => {
        if (!step) return '#334155';
        if (step.sorted?.has(i)) return '#10b981';
        if (step.hi?.includes(i)) return ALGORITHMS[algo].color;
        return '#334155';
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-bold text-white mb-1">🔧 Custom Sorting Sandbox</h3>
                <p className="text-slate-400 text-sm mb-4">Enter your own numbers, pick an algorithm, and watch it sort in real time!</p>

                <div className="flex gap-3 flex-wrap">
                    <input value={inputVal} onChange={e => setInputVal(e.target.value)}
                        placeholder="e.g. 38, 27, 43, 3, 9" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(102,126,234,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button onClick={build} className="btn-primary px-5 py-2.5 text-sm">Apply ▶</button>
                </div>
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

                <div className="flex gap-2 mt-3">
                    {Object.entries(ALGORITHMS).map(([key, a]) => (
                        <button key={key} onClick={() => setAlgorithm(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${algorithm === key ? 'text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}
                            style={algorithm === key ? { background: a.color + '33', borderColor: a.color + '77', color: a.color } : {}}>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visualization */}
            {step && (
                <div className="glass rounded-2xl p-6 flex items-end justify-center gap-2 min-h-[180px]">
                    {step.arr.map((val, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold" style={{ color: getColor(i, algorithm) }}>{val}</span>
                            <div className="rounded-t-md transition-all duration-300"
                                style={{ width: `${Math.max(28, Math.floor(280 / step.arr.length) - 4)}px`, height: `${(val / maxVal) * 140}px`, background: getColor(i, algorithm) }} />
                            <span className="text-xs text-slate-600">[{i}]</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Speed:</span>
                    {[[600, 'Slow'], [400, 'Normal'], [150, 'Fast']].map(([s, l]) => (
                        <button key={l} onClick={() => setSpeed(s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${speed === s ? 'border-primary-400 bg-primary-500/20 text-primary-300' : 'border-white/10 text-slate-400 hover:text-white'}`}>{l}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} disabled={isPlaying || !step}
                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm disabled:opacity-30">← Prev</button>
                    <button onClick={() => setIsPlaying(p => !p)} disabled={!steps.length} className="btn-primary text-sm px-5 py-2">
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <button onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))} disabled={isPlaying || !step}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-30">Next →</button>
                </div>
                <span className="text-slate-500 text-xs">{stepIdx + 1} / {steps.length} steps {runs > 0 && `• ${runs} run${runs > 1 ? 's' : ''}`}</span>
            </div>

            {runs < 2 && <div className="text-center text-slate-500 text-sm">💡 Try at least 2 different arrays or algorithms to complete this level!</div>}
            {done && <div className="text-center py-2 text-emerald-400 font-bold animate-fade-in">✅ Level Complete! Great exploring! +75 XP</div>}
        </div>
    );
}
