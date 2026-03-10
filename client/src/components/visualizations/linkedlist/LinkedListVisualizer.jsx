import { useState } from 'react';
import { useProgress } from '../../../context/ProgressContext';
import PseudoCodePanel from '../../shared/PseudoCodePanel';

const pseudoInsert = [
    'insert(val, pos):',
    '  new_node = Node(val)',
    '  if pos == 0:',
    '    new_node.next = head',
    '    head = new_node',
    '  else:',
    '    curr = head',
    '    traverse to pos-1',
    '    new_node.next = curr.next',
    '    curr.next = new_node',
];

const pseudoDelete = [
    'delete(val):',
    '  if head.val == val:',
    '    head = head.next',
    '    return',
    '  curr = head',
    '  while curr.next != null:',
    '    if curr.next.val == val:',
    '      curr.next = curr.next.next',
    '      return',
    '    curr = curr.next',
];

export default function LinkedListVisualizer({ moduleId = 'linked-list', levelId = 1 }) {
    const [list, setList] = useState([10, 20, 30, 40]);
    const [input, setInput] = useState('');
    const [position, setPosition] = useState('');
    const [msg, setMsg] = useState('Insert, delete or search nodes in the linked list!');
    const [msgType, setMsgType] = useState('info');
    const [highlighted, setHighlighted] = useState(null);
    const [pseudoLine, setPseudoLine] = useState(-1);
    const [ops, setOps] = useState(0);
    const [done, setDone] = useState(false);
    const { markComplete } = useProgress();

    const animatePseudo = async (lines, delay = 350) => {
        for (let i = 0; i < lines.length; i++) {
            setPseudoLine(i);
            await new Promise(r => setTimeout(r, delay));
        }
        setPseudoLine(-1);
    };

    const insert = async () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a valid number!'); setMsgType('warning'); return; }
        if (list.length >= 8) { setMsg('⚠️ Max 8 nodes for clarity!'); setMsgType('warning'); return; }
        const pos = position === '' ? list.length : Math.min(Math.max(0, parseInt(position) || 0), list.length);
        const newList = [...list.slice(0, pos), val, ...list.slice(pos)];
        setList(newList);
        setHighlighted(val);
        setInput(''); setPosition('');
        setMsg(`✅ Inserted ${val} at position ${pos}`);
        setMsgType('success');
        setOps(o => o + 1);
        await animatePseudo(pseudoInsert);
        setHighlighted(null);
        if (ops + 1 >= 5) { setDone(true); markComplete(moduleId, levelId); }
    };

    const deleteNode = async () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a value to delete!'); setMsgType('warning'); return; }
        if (!list.includes(val)) { setMsg(`❌ ${val} not found in the list!`); setMsgType('error'); return; }
        setList(list.filter(v => v !== val));
        setInput('');
        setMsg(`✅ Deleted node with value ${val}`);
        setMsgType('success');
        setOps(o => o + 1);
        await animatePseudo(pseudoDelete);
        if (ops + 1 >= 5) { setDone(true); markComplete(moduleId, levelId); }
    };

    const search = async () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a value to search!'); setMsgType('warning'); return; }
        const idx = list.indexOf(val);
        if (idx === -1) { setMsg(`❌ ${val} not found in the list!`); setMsgType('error'); return; }
        setHighlighted(val);
        setMsg(`🔍 Found ${val} at position ${idx}! (Traversed ${idx + 1} node${idx > 0 ? 's' : ''})`);
        setMsgType('success');
        await animatePseudo(['search(val):', '  curr = head', '  while curr != null:', '    if curr.val == val: return curr', '    curr = curr.next', '  return null'], 400);
        setTimeout(() => setHighlighted(null), 1000);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="glass rounded-xl p-4 text-sm text-slate-300">
                <p><strong className="text-white">Linked List:</strong> Each node holds a value and a pointer (<code className="text-primary-300">next</code>) to the next node. Unlike arrays, nodes are NOT stored in contiguous memory.</p>
            </div>

            {/* SVG Visualization */}
            <div className="glass rounded-2xl p-6 overflow-x-auto">
                <div className="flex items-center gap-0 min-w-max mx-auto">
                    <div className="flex flex-col items-center mr-2">
                        <span className="text-xs text-primary-400 font-bold mb-1">HEAD</span>
                        <div className="w-px h-6" style={{ background: 'rgba(102,126,234,0.5)' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    </div>
                    {list.map((val, i) => (
                        <div key={i} className="flex items-center">
                            {/* Node */}
                            <div className="flex rounded-lg overflow-hidden border-2 transition-all duration-500"
                                style={{ borderColor: highlighted === val ? '#f59e0b' : 'rgba(102,126,234,0.4)', boxShadow: highlighted === val ? '0 0 20px rgba(245,158,11,0.5)' : 'none' }}>
                                <div className="px-4 py-3 text-center" style={{ background: highlighted === val ? 'rgba(245,158,11,0.2)' : 'rgba(102,126,234,0.1)', minWidth: 52 }}>
                                    <div className="text-xs text-slate-500 mb-0.5">data</div>
                                    <div className="font-bold text-white text-base">{val}</div>
                                </div>
                                <div className="px-3 py-3 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="text-xs text-slate-600 mb-0.5">next</div>
                                    <div className="text-xs font-mono text-primary-400">{i < list.length - 1 ? '→' : 'null'}</div>
                                </div>
                            </div>
                            {/* Arrow */}
                            {i < list.length - 1 && (
                                <div className="flex items-center mx-1">
                                    <div className="h-px w-6" style={{ background: 'rgba(102,126,234,0.5)' }} />
                                    <div className="text-primary-400">▶</div>
                                </div>
                            )}
                        </div>
                    ))}
                    {list.length === 0 && <div className="text-slate-500 italic">Empty list — insert a node!</div>}
                </div>
                <div className="text-center mt-3 text-xs text-slate-600">
                    Length: {list.length} nodes
                </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-xl p-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && insert()}
                        placeholder="Node value" className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none' }} />
                    <input value={position} onChange={e => setPosition(e.target.value)}
                        placeholder="Position (optional)" className="w-40 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none' }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={insert} className="btn-primary text-sm px-4 py-2">+ Insert</button>
                    <button onClick={deleteNode} className="text-sm px-4 py-2 rounded-xl border font-semibold transition-all" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>✕ Delete</button>
                    <button onClick={search} className="text-sm px-4 py-2 rounded-xl border font-semibold transition-all" style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>🔍 Search</button>
                    <button onClick={() => { setList([10, 20, 30, 40]); setOps(0); setMsg('Reset!'); setMsgType('info'); }}
                        className="text-sm px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white">Reset</button>
                </div>
            </div>

            {/* Message */}
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${msgType === 'success' ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                    msgType === 'error' ? 'border border-red-500/40 bg-red-500/10 text-red-300' :
                        msgType === 'warning' ? 'border border-yellow-500/40 bg-yellow-500/10 text-yellow-300' :
                            'border border-white/10 bg-white/5 text-slate-300'
                }`}>{msg}</div>

            <PseudoCodePanel lines={pseudoLine >= 10 ? pseudoDelete : pseudoInsert} currentStep={pseudoLine} title="linked_list.py" />

            {done && <div className="text-center text-emerald-400 font-bold animate-fade-in py-2">✅ Level Complete! Great work with linked lists! +50 XP</div>}
            {!done && <div className="text-center text-slate-600 text-xs">Perform {Math.max(0, 5 - ops)} more operation{5 - ops !== 1 ? 's' : ''} to complete this level</div>}
        </div>
    );
}
