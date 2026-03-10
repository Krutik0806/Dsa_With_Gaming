import { useState } from 'react';
import PseudoCodePanel from '../../shared/PseudoCodePanel';
import CompletionScreen from '../../shared/CompletionScreen';
import { useProgress } from '../../../context/ProgressContext';

const MAX_SIZE = 6;
const pseudoCodePush = ['push(val):', '  if stack is FULL:', '    raise StackOverflow', '  top = top + 1', '  stack[top] = val'];
const pseudoCodePop = ['pop():', '  if stack is EMPTY:', '    raise StackUnderflow', '  val = stack[top]', '  top = top - 1', '  return val'];

export default function StackVisualizer({ moduleId = 'stack-queue', levelId = 1 }) {
    const [stack, setStack] = useState([10, 20, 30]);
    const [input, setInput] = useState('');
    const [msg, setMsg] = useState('Stack is ready! Push or Pop elements.');
    const [msgType, setMsgType] = useState('info');
    const [activeCode, setActiveCode] = useState(pseudoCodePush);
    const [codeLine, setCodeLine] = useState(-1);
    const [done, setDone] = useState(false);
    const [ops, setOps] = useState(0);
    const { markComplete } = useProgress();

    const animatePseudo = async (lines, setter) => {
        setter(lines);
        for (let i = 0; i < lines.length; i++) {
            setCodeLine(i);
            await new Promise(r => setTimeout(r, 500));
        }
        setCodeLine(-1);
    };

    const push = async () => {
        const val = parseInt(input);
        if (isNaN(val)) { setMsg('⚠️ Enter a valid number!'); setMsgType('warning'); return; }
        setActiveCode(pseudoCodePush);
        if (stack.length >= MAX_SIZE) {
            await animatePseudo(pseudoCodePush, setActiveCode);
            setMsg('🚨 Stack Overflow! Stack is full (max 6 elements).'); setMsgType('error'); return;
        }
        const newStack = [...stack, val];
        setStack(newStack);
        setInput('');
        setOps(o => o + 1);
        setMsg(`✅ Pushed ${val} onto the stack.`); setMsgType('success');
        await animatePseudo(pseudoCodePush, setActiveCode);
        if (ops >= 4) { setDone(true); markComplete(moduleId, levelId); }
    };

    const pop = async () => {
        setActiveCode(pseudoCodePop);
        if (stack.length === 0) {
            await animatePseudo(pseudoCodePop, setActiveCode);
            setMsg('🚨 Stack Underflow! Cannot pop from empty stack.'); setMsgType('error'); return;
        }
        const val = stack[stack.length - 1];
        setStack(stack.slice(0, -1));
        setOps(o => o + 1);
        setMsg(`✅ Popped ${val} from the stack.`); setMsgType('success');
        await animatePseudo(pseudoCodePop, setActiveCode);
    };

    if (done) return <CompletionScreen score={0} total={0} moduleId={moduleId} nextLevelId={levelId + 1} onRetry={() => { setStack([10, 20, 30]); setDone(false); setOps(0); }} />;

    const COLORS = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Stack Visual */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Stack (LIFO)</h3>
                        <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">{stack.length}/{MAX_SIZE}</span>
                    </div>

                    <div className="flex flex-col-reverse gap-2 min-h-[240px] border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50">
                        {stack.map((val, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg text-white font-bold text-sm transition-all duration-300"
                                style={{ background: COLORS[i % COLORS.length] }}>
                                <span>{val}</span>
                                {i === stack.length - 1 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">← TOP</span>}
                            </div>
                        ))}
                        {stack.length === 0 && <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Stack is Empty</div>}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && push()}
                            placeholder="Enter value" className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-400 outline-none text-sm" />
                        <button onClick={push} className="btn-primary text-sm px-4">Push</button>
                        <button onClick={pop} className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm">Pop</button>
                    </div>
                </div>

                {/* Pseudocode */}
                <PseudoCodePanel lines={activeCode} currentStep={codeLine} title="stack_ops.py" />
            </div>

            <div className={`rounded-xl px-4 py-3 font-medium text-center text-sm ${msgType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    msgType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                        msgType === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                            'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>{msg}</div>

            <div className="card bg-indigo-50 border-indigo-200">
                <p className="text-indigo-800 text-sm font-medium">💡 <strong>LIFO:</strong> The last element pushed is the first one to be popped. Like a stack of plates — you always take the top plate!</p>
            </div>
        </div>
    );
}
