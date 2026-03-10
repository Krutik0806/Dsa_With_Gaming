import { useState, useEffect, useRef } from 'react';
import PseudoCodePanel from '../../shared/PseudoCodePanel';
import StepControls from '../../shared/StepControls';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const COLORS = {
    default: '#667eea',
    comparing: '#f59e0b',
    swapping: '#ef4444',
    sorted: '#10b981',
};

const pseudoCode = [
    'for i = 0 to n-1:',
    '  for j = 0 to n-i-2:',
    '    if arr[j] > arr[j+1]:',
    '      swap(arr[j], arr[j+1])',
    '  mark arr[n-1-i] as sorted',
];

function generateSteps(arr) {
    const steps = [];
    const a = [...arr];
    const sortedIdx = new Set();

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length - i - 1; j++) {
            steps.push({ arr: [...a], comparing: [j, j + 1], swapping: [], sorted: new Set(sortedIdx), pseudoLine: 2, msg: `Comparing ${a[j]} and ${a[j + 1]}` });
            if (a[j] > a[j + 1]) {
                [a[j], a[j + 1]] = [a[j + 1], a[j]];
                steps.push({ arr: [...a], comparing: [], swapping: [j, j + 1], sorted: new Set(sortedIdx), pseudoLine: 3, msg: `Swapped! Array is now [${a.join(', ')}]` });
            }
        }
        sortedIdx.add(a.length - 1 - i);
        steps.push({ arr: [...a], comparing: [], swapping: [], sorted: new Set(sortedIdx), pseudoLine: 4, msg: `${a[a.length - 1 - i]} is now in its correct position ✅` });
    }
    steps.push({ arr: [...a], comparing: [], swapping: [], sorted: new Set([...Array(a.length).keys()]), pseudoLine: -1, msg: '🎉 Array is fully sorted!' });
    return steps;
}

export default function BubbleSortVisualizer({ moduleId = 'sorting', levelId = 1 }) {
    const INITIAL = [64, 34, 25, 12, 22, 11, 90];
    const steps = generateSteps(INITIAL);
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [done, setDone] = useState(false);
    const intervalRef = useRef(null);
    const { markComplete } = useProgress();

    const step = steps[stepIdx];
    const maxVal = Math.max(...INITIAL);

    const play = () => {
        if (stepIdx >= steps.length - 1) { setStepIdx(0); return; }
        setIsPlaying(true);
    };
    const pause = () => { setIsPlaying(false); clearInterval(intervalRef.current); };

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setStepIdx(prev => {
                    if (prev >= steps.length - 1) {
                        setIsPlaying(false);
                        setDone(true);
                        markComplete(moduleId, levelId);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 700);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying]);

    const getColor = (i) => {
        if (step.sorted.has(i)) return COLORS.sorted;
        if (step.swapping.includes(i)) return COLORS.swapping;
        if (step.comparing.includes(i)) return COLORS.comparing;
        return COLORS.default;
    };

    if (done) return <CompletionScreen score={0} total={0} moduleId={moduleId} nextLevelId={levelId + 1} onRetry={() => { setStepIdx(0); setDone(false); }} />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Legend */}
            <div className="flex gap-4 flex-wrap">
                {[['Comparing', COLORS.comparing], ['Swapping', COLORS.swapping], ['Sorted', COLORS.sorted], ['Unsorted', COLORS.default]].map(([lbl, col]) => (
                    <div key={lbl} className="flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 rounded" style={{ background: col }} />
                        <span className="text-gray-600">{lbl}</span>
                    </div>
                ))}
            </div>

            {/* Bars */}
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-6 border border-gray-200 min-h-[220px] flex items-end justify-center gap-3">
                {step.arr.map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-1" style={{ width: 52 }}>
                        <span className="text-xs font-bold text-gray-600">{val}</span>
                        <div
                            className="rounded-t-lg w-full transition-all duration-500"
                            style={{ height: `${(val / maxVal) * 160}px`, background: getColor(i) }}
                        />
                    </div>
                ))}
            </div>

            {/* Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-800 font-medium text-center">
                {step.msg}
            </div>

            <StepControls
                currentStep={stepIdx}
                totalSteps={steps.length}
                onPrev={() => setStepIdx(s => Math.max(0, s - 1))}
                onNext={() => {
                    if (stepIdx === steps.length - 1) { setDone(true); markComplete(moduleId, levelId); }
                    else setStepIdx(s => s + 1);
                }}
                onPlay={isPlaying ? pause : play}
                isPlaying={isPlaying}
            />

            <PseudoCodePanel lines={pseudoCode} currentStep={step.pseudoLine} title="bubble_sort.py" />
        </div>
    );
}
