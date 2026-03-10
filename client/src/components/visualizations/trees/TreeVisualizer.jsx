import { useState } from 'react';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

// Build a BST and compute SVG positions
function buildBST(values) {
    let root = null;
    const nodes = [];
    const edges = [];
    let idCounter = 0;

    const insert = (node, val, parentId = null, side = null) => {
        if (!node) {
            const id = idCounter++;
            const newNode = { id, val, left: null, right: null };
            if (parentId !== null) edges.push({ from: parentId, to: id, side });
            nodes.push({ id, val });
            return newNode;
        }
        if (val < node.val) node.left = insert(node.left, val, node.id, 'left');
        else if (val > node.val) node.right = insert(node.right, val, node.id, 'right');
        return node;
    };

    for (const val of values) root = insert(root, val);
    return { root, nodes: nodes.map(n => ({ ...n })), edges };
}

// Compute x,y positions using inorder traversal
function computePositions(root, depth = 0, positions = {}, counter = { val: 0 }) {
    if (!root) return positions;
    computePositions(root.left, depth + 1, positions, counter);
    positions[root.id] = { x: counter.val * 80 + 50, y: depth * 80 + 40 };
    counter.val++;
    computePositions(root.right, depth + 1, positions, counter);
    return positions;
}

export default function TreeVisualizer({ moduleId = 'trees', levelId = 2 }) {
    const [values, setValues] = useState([50, 30, 70, 20, 40, 60, 80]);
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState('Insert numbers to build a Binary Search Tree!');
    const [highlighted, setHighlighted] = useState(null);
    const [done, setDone] = useState(false);
    const { markComplete } = useProgress();

    const { root, edges } = buildBST(values);
    const positions = computePositions(root);

    const svgWidth = Math.max(...Object.values(positions).map(p => p.x), 300) + 80;
    const svgHeight = Math.max(...Object.values(positions).map(p => p.y), 100) + 80;

    const insertNode = () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a valid number!'); return; }
        if (values.includes(val)) { setMsg(`ℹ️ ${val} already exists in the tree!`); return; }
        setValues(v => [...v, val]);
        setHighlighted(val);
        setMsg(`✅ Inserted ${val} into the BST!`);
        setInput('');
        setTimeout(() => setHighlighted(null), 1500);
        if (values.length >= 10) { setDone(true); markComplete(moduleId, levelId); }
    };

    const reset = () => { setValues([50, 30, 70, 20, 40, 60, 80]); setHighlighted(null); setDone(false); setMsg('Tree reset!'); };

    // map node ids to values for rendering
    const nodeMap = {};
    const buildMap = (node) => { if (!node) return; nodeMap[node.id] = node.val; buildMap(node.left); buildMap(node.right); };
    buildMap(root);

    if (done) return <CompletionScreen score={0} total={0} moduleId={moduleId} nextLevelId={levelId + 1} onRetry={reset} />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 text-sm font-medium">
                    🌳 <strong>BST Rule:</strong> Left child &lt; Parent &lt; Right child. Insert a number and watch it find its correct position!
                </p>
            </div>

            {/* SVG Tree */}
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-auto">
                <svg width={svgWidth} height={svgHeight} className="block mx-auto">
                    {/* Edges */}
                    {edges.map((e, i) => {
                        const from = positions[e.from];
                        const to = positions[e.to];
                        if (!from || !to) return null;
                        return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#cbd5e1" strokeWidth="2" />;
                    })}
                    {/* Nodes */}
                    {Object.entries(positions).map(([id, pos]) => {
                        const val = nodeMap[parseInt(id)];
                        const isNew = val === highlighted;
                        return (
                            <g key={id}>
                                <circle cx={pos.x} cy={pos.y} r={28} fill={isNew ? '#f59e0b' : '#667eea'} className="transition-all duration-500" />
                                <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{val}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className={`rounded-xl px-4 py-3 font-medium text-center text-sm bg-blue-50 text-blue-800 border border-blue-200`}>{msg}</div>

            <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && insertNode()}
                    placeholder="Enter number to insert" className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-400 outline-none" />
                <button onClick={insertNode} className="btn-primary px-6">Insert</button>
                <button onClick={reset} className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-red-400 font-medium">Reset</button>
            </div>

            <div className="text-sm text-gray-500 text-center">Nodes: {values.length} | Insert a few more nodes to complete this level!</div>
        </div>
    );
}
