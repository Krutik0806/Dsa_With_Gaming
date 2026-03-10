import { useState } from 'react';
import { useProgress } from '../../../context/ProgressContext';
import CompletionScreen from '../../shared/CompletionScreen';

// Code fill-in challenge: given a pseudocode snippet with __ blanks, pick the right word
const CHALLENGES = [
    {
        title: 'Linked List Insert at Head',
        code: ['def insert_at_head(val):', '  new_node = Node(val)', '  new_node.next = ____', '  head = ____'],
        blanks: [{ line: 2, answer: 'head', options: ['null', 'head', 'tail', 'new_node'] },
        { line: 3, answer: 'new_node', options: ['null', 'head', 'new_node', 'val'] }],
        hint: 'The new node takes the CURRENT head as its next, then becomes the new head.',
    },
    {
        title: 'Insert at End',
        code: ['def insert_at_end(val):', '  new_node = Node(val)', '  new_node.next = ____', '  curr = head', '  while curr.____ != null:', '    curr = curr.next', '  curr.next = new_node'],
        blanks: [{ line: 2, answer: 'null', options: ['head', 'null', 'new_node', 'curr'] },
        { line: 4, answer: 'next', options: ['val', 'head', 'next', 'data'] }],
        hint: 'The last node\'s next should be null. Traverse while the NEXT pointer is not null.',
    },
    {
        title: 'Delete a Node',
        code: ['def delete(val):', '  if head.val == val:', '    head = head.____', '  curr = head', '  while curr.next != null:', '    if curr.next.val == val:', '      curr.next = curr.next.____', '      return', '    curr = curr.next'],
        blanks: [{ line: 2, answer: 'next', options: ['val', 'next', 'prev', 'null'] },
        { line: 6, answer: 'next', options: ['val', 'prev', 'next', 'head'] }],
        hint: 'To skip a node, point its predecessor\'s next to its SUCCESSOR\'s next.',
    },
    {
        title: 'Search a Value',
        code: ['def search(val):', '  curr = ____', '  while curr != null:', '    if curr.val == val:', '      return True', '    curr = curr.____', '  return False'],
        blanks: [{ line: 1, answer: 'head', options: ['null', 'head', 'tail', '0'] },
        { line: 5, answer: 'next', options: ['prev', 'val', 'next', 'head'] }],
        hint: 'Linear search starts at HEAD and follows NEXT pointers until the value is found.',
    },
];

export default function CodeFillChallenge({ moduleId = 'linked-list', levelId = 3 }) {
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [checked, setChecked] = useState(false);
    const [score, setScore] = useState(0);
    const [allDone, setAllDone] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const { markComplete } = useProgress();

    const challenge = CHALLENGES[challengeIdx];

    const select = (blankIdx, val) => {
        if (checked) return;
        setUserAnswers(prev => ({ ...prev, [blankIdx]: val }));
    };

    const check = () => {
        const correct = challenge.blanks.filter((b, i) => userAnswers[i] === b.answer).length;
        setScore(s => s + correct);
        setChecked(true);
    };

    const next = () => {
        if (challengeIdx >= CHALLENGES.length - 1) {
            setAllDone(true);
            markComplete(moduleId, levelId);
        } else {
            setChallengeIdx(c => c + 1);
            setUserAnswers({});
            setChecked(false);
            setShowHint(false);
        }
    };

    const renderCode = () => {
        return challenge.code.map((line, lineIdx) => {
            const blank = challenge.blanks.find((b, bi) => b.line === lineIdx ? bi : false) ??
                challenge.blanks.find(b => b.line === lineIdx);
            const blankIdx = challenge.blanks.findIndex(b => b.line === lineIdx);

            if (!blank || blankIdx < 0) return (
                <div key={lineIdx} className="px-3 py-1.5 text-slate-300 font-mono text-sm">
                    <span className="text-slate-700 mr-3 select-none">{lineIdx + 1}</span>
                    {line}
                </div>
            );

            const userAns = userAnswers[blankIdx];
            const isCorrect = checked && userAns === blank.answer;
            const isWrong = checked && userAns !== blank.answer;

            const parts = line.split('____');
            return (
                <div key={lineIdx} className="px-3 py-1.5 font-mono text-sm flex items-center flex-wrap gap-1">
                    <span className="text-slate-700 mr-3 select-none">{lineIdx + 1}</span>
                    <span className="text-slate-300">{parts[0]}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg border font-bold text-xs transition-all ${isCorrect ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' :
                            isWrong ? 'bg-red-500/20 border-red-500/60 text-red-300' :
                                userAns ? 'bg-primary-500/20 border-primary-500/60 text-primary-300' :
                                    'bg-white/5 border-dashed border-white/20 text-slate-500'
                        }`}>
                        {userAns || '  ____  '}
                        {isCorrect && ' ✓'}
                        {isWrong && ` ✗ (${blank.answer})`}
                    </span>
                    <span className="text-slate-300">{parts[1]}</span>
                </div>
            );
        });
    };

    if (allDone) return (
        <div className="text-center py-12 animate-fade-in">
            <div className="text-7xl mb-4">💻</div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Code Master!</h2>
            <p className="text-slate-400 mb-6">You completed all {CHALLENGES.length} code fill challenges!</p>
            <div className="inline-block glass rounded-2xl px-8 py-4 mb-6">
                <div className="gradient-text font-black text-4xl">{score}</div>
                <div className="text-slate-400 text-sm">blanks filled correctly</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="font-display text-white font-bold">📝 Challenge {challengeIdx + 1}/{CHALLENGES.length}: {challenge.title}</h3>
                <button onClick={() => setShowHint(h => !h)} className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20">
                    💡 {showHint ? 'Hide' : 'Show'} Hint
                </button>
            </div>

            {showHint && (
                <div className="glass rounded-xl px-4 py-3 border border-yellow-500/20 text-yellow-300 text-sm">
                    💡 {challenge.hint}
                </div>
            )}

            {/* Code editor */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="w-3 h-3 rounded-full bg-red-500/70" /><span className="w-3 h-3 rounded-full bg-yellow-500/70" /><span className="w-3 h-3 rounded-full bg-green-500/70" />
                    <span className="text-slate-500 text-xs ml-2 font-mono">linked_list.py</span>
                </div>
                <div className="p-3">{renderCode()}</div>
            </div>

            {/* Option buttons per blank */}
            {challenge.blanks.map((blank, bi) => (
                <div key={bi}>
                    <p className="text-slate-400 text-sm mb-2">Blank {bi + 1} — which keyword goes here?</p>
                    <div className="flex gap-2 flex-wrap">
                        {blank.options.map(opt => (
                            <button key={opt} onClick={() => select(bi, opt)} disabled={checked}
                                className="px-5 py-2.5 rounded-xl font-mono text-sm font-bold border transition-all"
                                style={{
                                    background: userAnswers[bi] === opt ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.04)',
                                    borderColor: userAnswers[bi] === opt ? 'rgba(102,126,234,0.7)' : 'rgba(255,255,255,0.1)',
                                    color: userAnswers[bi] === opt ? '#c4b5fd' : '#94a3b8',
                                }}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-between">
                {!checked ? (
                    <button onClick={check} disabled={Object.keys(userAnswers).length < challenge.blanks.length}
                        className="btn-primary px-8 py-3 disabled:opacity-40">Check Answers ✓</button>
                ) : (
                    <button onClick={next} className="btn-primary px-8 py-3">
                        {challengeIdx >= CHALLENGES.length - 1 ? '🎉 Finish' : 'Next Challenge →'}
                    </button>
                )}
                <div className="text-slate-500 text-sm self-center">Score: {score} / {challengeIdx * 2}</div>
            </div>
        </div>
    );
}
