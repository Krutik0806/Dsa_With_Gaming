import { useState, useEffect, useRef } from 'react';
import PseudoCodePanel from '../../shared/PseudoCodePanel';
import StepControls from '../../shared/StepControls';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const COLORS = { default: '#667eea', min: '#f59e0b', swapping: '#ef4444', sorted: '#10b981', current: '#8b5cf6' };

const pseudoCode = [
    'for i = 0 to n-1:',
    '  min_idx = i',
    '  for j = i+1 to n:',
    '    if arr[j] < arr[min_idx]:',
    '      min_idx = j',
    '  swap(arr[i], arr[min_idx])',
    '  mark arr[i] as sorted',
];

function generateSteps(arr) {
    const steps = [];
    const a = [...arr];
    const sortedIdx = new Set();

    for (let i = 0; i < a.length - 1; i++) {
        let minIdx = i;
        steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx, current: i, swapping: [], pseudoLine: 1, msg: `Pass ${i + 1}: Finding minimum from index ${i}` });
        for (let j = i + 1; j < a.length; j++) {
            steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx, current: i, swapping: [], pseudoLine: 3, msg: `Comparing ${a[j]} with current minimum ${a[minIdx]}` });
            if (a[j] < a[minIdx]) {
                minIdx = j;
                steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx, current: i, swapping: [], pseudoLine: 4, msg: `New minimum found: ${a[minIdx]} at index ${minIdx}` });
            }
        }
        if (minIdx !== i) {
            [a[i], a[minIdx]] = [a[minIdx], a[i]];
            steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx: i, current: i, swapping: [i, minIdx], pseudoLine: 5, msg: `Swapping ${a[minIdx]} and ${a[i]}` });
        }
        sortedIdx.add(i);
        steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx: -1, current: -1, swapping: [], pseudoLine: 6, msg: `${a[i]} is now in correct position ✅` });
    }
    sortedIdx.add(a.length - 1);
    steps.push({ arr: [...a], sorted: new Set(sortedIdx), minIdx: -1, current: -1, swapping: [], pseudoLine: -1, msg: '🎉 Array fully sorted!' });
    return steps;
}

export default function SelectionSortVisualizer({ moduleId = 'sorting', levelId = 3 }) {
    const INITIAL = [64, 25, 12, 22, 11];
    const steps = generateSteps(INITIAL);
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [done, setDone] = useState(false);
    const intervalRef = useRef(null);
    const { markComplete } = useProgress();

    const step = steps[stepIdx];
    const maxVal = Math.max(...INITIAL);

    const play = () => setIsPlaying(true);
    const pause = () => { setIsPlaying(false); clearInterval(intervalRef.current); };

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setStepIdx(prev => {
                    if (prev >= steps.length - 1) { setIsPlaying(false); setDone(true); markComplete(moduleId, levelId); return prev; }
                    return prev + 1;
                });
            }, 800);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying]);

    const getColor = (i) => {
        if (step.sorted.has(i)) return COLORS.sorted;
        if (step.swapping.includes(i)) return COLORS.swapping;
        if (i === step.minIdx) return COLORS.min;
        if (i === step.current) return COLORS.current;
        return COLORS.default;
    };

    if (done) return <CompletionScreen score={0} total={0} moduleId={moduleId} nextLevelId={levelId + 1} onRetry={() => { setStepIdx(0); setDone(false); }} />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex gap-4 flex-wrap">
                {[['Current Pass Start', COLORS.current], ['Minimum Found', COLORS.min], ['Swapping', COLORS.swapping], ['Sorted', COLORS.sorted]].map(([lbl, col]) => (
                    <div key={lbl} className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 rounded" style={{ background: col }} />
                        <span className="text-gray-600">{lbl}</span>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-6 border border-gray-200 min-h-[220px] flex items-end justify-center gap-4">
                {step.arr.map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-1" style={{ width: 60 }}>
                        <span className="text-xs font-bold text-gray-600">{val}</span>
                        <div className="rounded-t-lg w-full transition-all duration-500" style={{ height: `${(val / maxVal) * 160}px`, background: getColor(i) }} />
                        <span className="text-xs text-gray-400">[{i}]</span>
                    </div>
                ))}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-purple-800 font-medium text-center">
                {step.msg}
            </div>

            <StepControls currentStep={stepIdx} totalSteps={steps.length}
                onPrev={() => setStepIdx(s => Math.max(0, s - 1))}
                onNext={() => { if (stepIdx === steps.length - 1) { setDone(true); markComplete(moduleId, levelId); } else setStepIdx(s => s + 1); }}
                onPlay={isPlaying ? pause : play} isPlaying={isPlaying}
            />
            <PseudoCodePanel lines={pseudoCode} currentStep={step.pseudoLine} title="selection_sort.py" />
        </div>
    );
}
