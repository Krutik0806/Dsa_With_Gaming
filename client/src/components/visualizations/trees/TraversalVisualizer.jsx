import { useState, useEffect, useRef } from 'react';
import PseudoCodePanel from '../../shared/PseudoCodePanel';
import StepControls from '../../shared/StepControls';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const TRAVERSALS = {
    inorder: {
        label: 'In-Order (Left → Root → Right)',
        pseudo: ['inorder(node):', '  if node is None: return', '  inorder(node.left)', '  visit(node)', '  inorder(node.right)'],
        color: '#667eea',
    },
    preorder: {
        label: 'Pre-Order (Root → Left → Right)',
        pseudo: ['preorder(node):', '  if node is None: return', '  visit(node)', '  preorder(node.left)', '  preorder(node.right)'],
        color: '#f59e0b',
    },
    postorder: {
        label: 'Post-Order (Left → Right → Root)',
        pseudo: ['postorder(node):', '  if node is None: return', '  postorder(node.left)', '  postorder(node.right)', '  visit(node)'],
        color: '#10b981',
    },
};

// Fixed tree for traversal demo
const FIXED_VALUES = [50, 30, 70, 20, 40, 60, 80];

function buildTree(values) {
    let root = null; let id = 0;
    const insert = (node, val, parentId = null, side = null, allNodes, allEdges) => {
        if (!node) {
            const n = { id: id++, val, left: null, right: null };
            allNodes.push(n);
            if (parentId !== null) allEdges.push({ from: parentId, to: n.id });
            return n;
        }
        if (val < node.val) node.left = insert(node.left, val, node.id, 'left', allNodes, allEdges);
        else node.right = insert(node.right, val, node.id, 'right', allNodes, allEdges);
        return node;
    };
    const allNodes = [], allEdges = [];
    for (const v of values) root = insert(root, v, null, null, allNodes, allEdges);
    return { root, allNodes, allEdges };
}

function computePositions(node, depth = 0, counter = { v: 0 }, pos = {}) {
    if (!node) return pos;
    computePositions(node.left, depth + 1, counter, pos);
    pos[node.id] = { x: counter.v * 80 + 50, y: depth * 80 + 40 };
    counter.v++;
    computePositions(node.right, depth + 1, counter, pos);
    return pos;
}

function getTraversalOrder(node, type) {
    if (!node) return [];
    if (type === 'inorder') return [...getTraversalOrder(node.left, type), node.id, ...getTraversalOrder(node.right, type)];
    if (type === 'preorder') return [node.id, ...getTraversalOrder(node.left, type), ...getTraversalOrder(node.right, type)];
    return [...getTraversalOrder(node.left, type), ...getTraversalOrder(node.right, type), node.id];
}

export default function TraversalVisualizer({ moduleId = 'trees', levelId = 3 }) {
    const [traversalType, setTraversalType] = useState('inorder');
    const [stepIdx, setStepIdx] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [visited, setVisited] = useState([]);
    const [done, setDone] = useState(false);
    const intervalRef = useRef(null);
    const { markComplete } = useProgress();

    const { root, allNodes, allEdges } = buildTree(FIXED_VALUES);
    const positions = computePositions(root);
    const order = getTraversalOrder(root, traversalType);
    const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n.val]));
    const svgWidth = Math.max(...Object.values(positions).map(p => p.x)) + 80;
    const svgHeight = Math.max(...Object.values(positions).map(p => p.y)) + 80;
    const t = TRAVERSALS[traversalType];

    useEffect(() => { setStepIdx(-1); setVisited([]); setIsPlaying(false); clearInterval(intervalRef.current); }, [traversalType]);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setStepIdx(prev => {
                    const next = prev + 1;
                    if (next >= order.length) {
                        setIsPlaying(false);
                        setVisited([...order]);
                        setDone(true);
                        markComplete(moduleId, levelId);
                        return prev;
                    }
                    setVisited(v => [...v, order[next]]);
                    return next;
                });
            }, 900);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPlaying, traversalType]);

    const getNodeFill = (id) => {
        if (stepIdx >= 0 && order[stepIdx] === id) return t.color;
        if (visited.includes(id)) return '#d1d5db';
        return '#667eea';
    };

    const reset = () => { setStepIdx(-1); setVisited([]); setIsPlaying(false); setDone(false); };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex gap-2 flex-wrap">
                {Object.entries(TRAVERSALS).map(([key, tv]) => (
                    <button key={key} onClick={() => { setTraversalType(key); reset(); }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm border-2 transition-all ${traversalType === key ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
                        style={traversalType === key ? { background: tv.color, borderColor: tv.color } : {}}>
                        {tv.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-auto">
                <svg width={svgWidth} height={svgHeight} className="block mx-auto">
                    {allEdges.map((e, i) => {
                        const f = positions[e.from], to = positions[e.to];
                        if (!f || !to) return null;
                        return <line key={i} x1={f.x} y1={f.y} x2={to.x} y2={to.y} stroke="#cbd5e1" strokeWidth="2" />;
                    })}
                    {allNodes.map(n => {
                        const pos = positions[n.id];
                        if (!pos) return null;
                        return (
                            <g key={n.id}>
                                <circle cx={pos.x} cy={pos.y} r={28} fill={getNodeFill(n.id)} className="transition-all duration-500" />
                                <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{n.val}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {stepIdx >= 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-800 font-medium text-center">
                    Visiting: <strong>{nodeMap[order[stepIdx]]}</strong>
                    {' | '}Visited so far: [{visited.map(id => nodeMap[id]).join(', ')}]
                </div>
            )}

            <StepControls currentStep={Math.max(0, stepIdx)} totalSteps={order.length}
                onPrev={() => { const ni = Math.max(-1, stepIdx - 1); setStepIdx(ni); setVisited(order.slice(0, ni + 1)); }}
                onNext={() => { const ni = Math.min(order.length - 1, stepIdx + 1); setStepIdx(ni); setVisited(order.slice(0, ni + 1)); if (ni === order.length - 1) { setDone(true); markComplete(moduleId, levelId); } }}
                onPlay={isPlaying ? () => { setIsPlaying(false); clearInterval(intervalRef.current); } : () => setIsPlaying(true)}
                isPlaying={isPlaying}
            />

            <PseudoCodePanel lines={t.pseudo} currentStep={stepIdx >= 0 ? 3 : -1} title={`${traversalType}_traversal.py`} />
        </div>
    );
}
