import { useState, useEffect, useRef } from 'react';
import localQuizzes from '../../data/quizzes.json';
import { useProgress } from '../../context/ProgressContext';

const HEART_COUNT = 3;

function Heart({ broken }) {
    return <span className={`text-2xl transition-all duration-300 ${broken ? 'opacity-20 grayscale' : ''}`}>❤️</span>;
}

function QuizComponent({ moduleId, onComplete }) {
    const questions = localQuizzes[moduleId] || [];
    const { markFlawless } = useProgress();
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const [current, setCurrent] = useState(0);
    const [hearts, setHearts] = useState(HEART_COUNT);  // lives
    const [failed, setFailed] = useState(false);
    const [shake, setShake] = useState(false);
    const [timer, setTimer] = useState(0);            // seconds elapsed
    const [flawless, setFlawless] = useState(true);
    const timerRef = useRef(null);

    // Start timer
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const select = (optIdx) => {
        if (submitted || failed) return;
        const updated = [...answers];
        updated[current] = optIdx;
        setAnswers(updated);

        // Instant feedback: wrong answer costs a heart
        const q = questions[current];
        if (optIdx !== q.correctIndex) {
            const newHearts = hearts - 1;
            setHearts(newHearts);
            setFlawless(false);
            setShake(true);
            setTimeout(() => setShake(false), 600);
            if (newHearts <= 0) {
                clearInterval(timerRef.current);
                setTimeout(() => setFailed(true), 700);
            }
        }
    };

    const goNext = () => {
        if (current < questions.length - 1) setCurrent(c => c + 1);
    };

    const handleSubmit = () => {
        clearInterval(timerRef.current);
        let score = 0;
        const res = questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            if (isCorrect) score++;
            return { isCorrect, correctIndex: q.correctIndex, explanation: q.explanation };
        });
        const pct = Math.round((score / questions.length) * 100);
        setResults({ score, total: questions.length, percentage: pct, results: res, timeTaken: timer });
        setSubmitted(true);
        if (flawless && hearts === HEART_COUNT) markFlawless();
    };

    const retry = () => {
        clearInterval(timerRef.current);
        setAnswers(Array(questions.length).fill(null));
        setSubmitted(false); setResults(null); setCurrent(0);
        setHearts(HEART_COUNT); setFailed(false); setTimer(0); setFlawless(true);
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    };

    if (!questions.length) return (
        <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-400">No questions available.</p>
        </div>
    );

    /* ── FAILED SCREEN ── */
    if (failed) return (
        <div className="text-center py-12 animate-fade-in">
            <div className="text-7xl mb-4">💔</div>
            <h2 className="font-display text-3xl font-black text-white mb-2">Out of Hearts!</h2>
            <p className="text-slate-400 mb-2">You ran out of lives. Study the material and try again!</p>
            <p className="text-slate-500 text-sm mb-8">Time: {formatTime(timer)}</p>
            <button onClick={retry} className="btn-primary px-10 py-4 text-base">🔄 Try Again</button>
        </div>
    );

    /* ── RESULTS SCREEN ── */
    if (submitted && results) {
        const stars = results.percentage >= 90 ? 3 : results.percentage >= 70 ? 2 : 1;
        const xpEarned = Math.round(results.percentage * 1.5);
        return (
            <div className="text-center py-8 animate-fade-in">
                <div className="text-7xl mb-4 animate-float">{'⭐'.repeat(stars)}</div>
                <h2 className="font-display text-3xl font-black text-white mb-1">Quiz Complete!</h2>
                <p className="text-6xl font-black gradient-text mb-1">{results.percentage}%</p>
                <p className="text-slate-400 mb-1">{results.score} / {results.total} correct</p>
                <p className="text-slate-500 text-sm mb-2">Time: {formatTime(results.timeTaken)}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <span className="text-yellow-400 font-bold">+{xpEarned} XP</span>
                    {flawless && hearts === HEART_COUNT && <span className="text-emerald-400 text-sm">+ Flawless Bonus! ❤️</span>}
                </div>

                <div className="space-y-3 text-left max-w-2xl mx-auto mb-8">
                    {questions.map((q, i) => {
                        const r = results.results[i];
                        return (
                            <div key={i} className={`p-4 rounded-2xl border ${r.isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                                <p className="font-semibold text-white mb-1.5">{i + 1}. {q.question}</p>
                                <p className={`text-sm font-medium ${r.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {r.isCorrect ? '✅ Correct!' : `❌ Answer: ${q.options[r.correctIndex]}`}
                                </p>
                                {r.explanation && <p className="text-xs text-slate-500 mt-1 italic">{r.explanation}</p>}
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => onComplete && onComplete(results.score, results.total, results.percentage === 100)}
                    className="btn-primary text-lg px-10 py-4">🎉 Complete Level</button>
            </div>
        );
    }

    /* ── QUESTION SCREEN ── */
    const q = questions[current];
    const selectedAnswer = answers[current];
    const allAnswered = answers.every(a => a !== null);
    const pct = ((current + 1) / questions.length) * 100;

    return (
        <div className={`max-w-2xl mx-auto animate-fade-in ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>

            {/* HUD row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">{[...Array(HEART_COUNT)].map((_, i) => <Heart key={i} broken={i >= hearts} />)}</div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: timer > 180 ? '#f87171' : '#94a3b8' }}>
                    ⏱ {formatTime(timer)}
                </div>
                <div className="text-slate-500 text-sm">{current + 1} / {questions.length}</div>
            </div>

            {/* Progress bar */}
            <div className="w-full rounded-full h-1.5 mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            {/* Question */}
            <h3 className="font-display text-xl font-bold text-white mb-6 leading-relaxed">{q.question}</h3>

            {/* Options */}
            <div className="space-y-3 mb-8">
                {q.options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === q.correctIndex;
                    const showFeedback = isSelected;
                    return (
                        <button key={i} onClick={() => select(i)}
                            className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 font-medium"
                            style={{
                                background: isSelected ? (isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.04)',
                                borderColor: isSelected ? (isCorrect ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)') : 'rgba(255,255,255,0.1)',
                                color: '#cbd5e1',
                            }}>
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                style={{ background: isSelected ? (isCorrect ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)') : 'rgba(255,255,255,0.08)', color: isSelected ? 'white' : '#94a3b8' }}>
                                {isSelected ? (isCorrect ? '✓' : '✗') : String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                        </button>
                    );
                })}
            </div>

            {/* Nav */}
            <div className="flex justify-between">
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                    className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-medium transition-all disabled:opacity-30">
                    ← Prev
                </button>
                {current < questions.length - 1 ? (
                    <button onClick={goNext} disabled={selectedAnswer === null}
                        className="btn-primary px-8 py-3 disabled:opacity-40">
                        Next →
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={!allAnswered}
                        className="font-bold px-8 py-3 rounded-xl text-white disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                        Submit 🚀
                    </button>
                )}
            </div>
        </div>
    );
}

export default QuizComponent;
