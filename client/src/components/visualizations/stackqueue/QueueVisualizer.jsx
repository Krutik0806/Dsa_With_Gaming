import { useState } from 'react';
import PseudoCodePanel from '../../shared/PseudoCodePanel';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const MAX_SIZE = 6;
const pseudoCodeEnqueue = ['enqueue(val):', '  if queue is FULL:', '    raise QueueFull', '  rear = rear + 1', '  queue[rear] = val'];
const pseudoCodeDequeue = ['dequeue():', '  if queue is EMPTY:', '    raise QueueEmpty', '  val = queue[front]', '  front = front + 1', '  return val'];

export default function QueueVisualizer({ moduleId = 'stack-queue', levelId = 2 }) {
    const [queue, setQueue] = useState([5, 15, 25]);
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState('Queue is ready! Enqueue or Dequeue elements.');
    const [msgType, setMsgType] = useState('info');
    const [activeCode, setActiveCode] = useState(pseudoCodeEnqueue);
    const [codeLine, setCodeLine] = useState(-1);
    const [done, setDone] = useState(false);
    const [ops, setOps] = useState(0);
    const { markComplete } = useProgress();

    const animatePseudo = async (lines) => {
        setActiveCode(lines);
        for (let i = 0; i < lines.length; i++) {
            setCodeLine(i);
            await new Promise(r => setTimeout(r, 500));
        }
        setCodeLine(-1);
    };

    const enqueue = async () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a valid number!'); setMsgType('warning'); return; }
        if (queue.length >= MAX_SIZE) { setMsg('🚨 Queue is FULL! Cannot enqueue.'); setMsgType('error'); await animatePseudo(pseudoCodeEnqueue); return; }
        setQueue(q => [...q, val]);
        setInput('');
        setOps(o => o + 1);
        setMsg(`✅ Enqueued ${val} at the REAR.`); setMsgType('success');
        await animatePseudo(pseudoCodeEnqueue);
        if (ops >= 4) { setDone(true); markComplete(moduleId, levelId); }
    };

    const dequeue = async () => {
        if (queue.length === 0) { setMsg('🚨 Queue is EMPTY! Cannot dequeue.'); setMsgType('error'); await animatePseudo(pseudoCodeDequeue); return; }
        const val = queue[0];
        setQueue(q => q.slice(1));
        setOps(o => o + 1);
        setMsg(`✅ Dequeued ${val} from the FRONT.`); setMsgType('success');
        await animatePseudo(pseudoCodeDequeue);
    };

    if (done) return <CompletionScreen score={0} total={0} moduleId={moduleId} nextLevelId={levelId + 1} onRetry={() => { setQueue([5, 15, 25]); setDone(false); setOps(0); }} />;

    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#667eea', '#764ba2', '#3b82f6'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Queue (FIFO)</h3>
                        <span className="text-sm bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full">{queue.length}/{MAX_SIZE}</span>
                    </div>

                    {/* FRONT / REAR labels */}
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 px-2">
                        <span className="text-red-500">FRONT (Dequeue) ←</span>
                        <span className="text-green-500">→ REAR (Enqueue)</span>
                    </div>

                    <div className="flex items-center gap-2 min-h-[80px] border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 overflow-x-auto">
                        {queue.map((val, i) => (
                            <div key={i} className="flex-shrink-0 flex items-center justify-center w-16 h-14 rounded-lg text-white font-bold transition-all duration-300"
                                style={{ background: COLORS[i % COLORS.length] }}>
                                {val}
                            </div>
                        ))}
                        {queue.length === 0 && <div className="flex-1 text-center text-gray-400 text-sm">Queue is Empty</div>}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enqueue()}
                            placeholder="Value to enqueue" className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-400 outline-none text-sm" />
                        <button onClick={enqueue} className="btn-primary text-sm px-4">Enqueue</button>
                        <button onClick={dequeue} className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm">Dequeue</button>
                    </div>
                </div>

                <PseudoCodePanel lines={activeCode} currentStep={codeLine} title="queue_ops.py" />
            </div>

            <div className={`rounded-xl px-4 py-3 font-medium text-center text-sm ${msgType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    msgType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                        msgType === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                            'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>{msg}</div>

            <div className="card bg-purple-50 border-purple-200">
                <p className="text-purple-800 text-sm font-medium">💡 <strong>FIFO:</strong> The first element enqueued is the first one dequeued. Like a queue at a ticket counter — first come, first served!</p>
            </div>
        </div>
    );
}
