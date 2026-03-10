import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useProgress } from '../context/ProgressContext'
import QuizComponent from '../components/shared/QuizComponent'
import CompletionScreen from '../components/shared/CompletionScreen'

// Sorting
const BubbleSortVisualizer = lazy(() => import('../components/visualizations/sorting/BubbleSortVisualizer'))
const InteractiveSorting = lazy(() => import('../components/visualizations/sorting/InteractiveSorting'))
const SelectionSortVisualizer = lazy(() => import('../components/visualizations/sorting/SelectionSortVisualizer'))
const AlgorithmRace = lazy(() => import('../components/visualizations/sorting/AlgorithmRace'))
const SortingSandbox = lazy(() => import('../components/visualizations/sorting/SortingSandbox'))
// Stack & Queue
const StackVisualizer = lazy(() => import('../components/visualizations/stackqueue/StackVisualizer'))
const QueueVisualizer = lazy(() => import('../components/visualizations/stackqueue/QueueVisualizer'))
// Trees
const TreeVisualizer = lazy(() => import('../components/visualizations/trees/TreeVisualizer'))
const TraversalVisualizer = lazy(() => import('../components/visualizations/trees/TraversalVisualizer'))
// Linked List
const LinkedListVisualizer = lazy(() => import('../components/visualizations/linkedlist/LinkedListVisualizer'))
const CodeFillChallenge = lazy(() => import('../components/visualizations/linkedlist/CodeFillChallenge'))

const MODULE_META = {
    sorting: {
        title: 'Sorting Algorithms', icon: '🔄', color: 'from-blue-500 to-indigo-600', glow: 'rgba(99,102,241,0.3)',
        levels: {
            1: { title: 'Bubble Sort – Concept', desc: 'Watch Bubble Sort animate step-by-step with pseudocode.' },
            2: { title: 'Bubble Sort – Interactive', desc: '3 difficulty modes! Sort under a time limit.' },
            3: { title: 'Selection Sort – Practice', desc: 'See how Selection Sort finds minimums each pass.' },
            4: { title: '⚡ Algorithm Race', desc: 'Bubble vs Selection Sort simultaneously — who wins?' },
            5: { title: '🔧 Custom Sandbox', desc: 'Enter any array, pick any algorithm, explore freely!' },
            6: { title: 'Sorting Quiz', desc: '10-question quiz covering both sorting algorithms.' },
        }
    },
    'stack-queue': {
        title: 'Stack & Queue', icon: '📚', color: 'from-purple-500 to-pink-600', glow: 'rgba(217,70,239,0.3)',
        levels: {
            1: { title: 'Stack Operations', desc: 'Push and pop — LIFO in action with overflow/underflow.' },
            2: { title: 'Queue Operations', desc: 'Enqueue and dequeue — understand FIFO behavior.' },
            3: { title: 'Interactive Practice', desc: 'Use both Stack and Queue at the same time!' },
            4: { title: 'Stack & Queue Quiz', desc: '10-question hearts-based quiz on LIFO & FIFO.' },
        }
    },
    trees: {
        title: 'Tree Basics', icon: '🌳', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.3)',
        levels: {
            1: { title: 'Binary Tree Intro', desc: 'Understand nodes, roots, leaves, and tree structure.' },
            2: { title: 'BST Insertion', desc: 'Insert numbers and watch your BST grow dynamically!' },
            3: { title: 'Tree Traversals', desc: 'In-order, Pre-order, Post-order — explore and compare.' },
            4: { title: 'Trees Quiz', desc: '10-question quiz testing all your tree knowledge.' },
        }
    },
    'linked-list': {
        title: 'Linked Lists', icon: '🔗', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.3)',
        levels: {
            1: { title: 'Insert, Delete, Search', desc: 'Build a linked list — insert at any position, delete, search!' },
            2: { title: 'Linked List Concepts', desc: 'Types of linked lists, time complexities, and real uses.' },
            3: { title: '📝 Code Fill Challenge', desc: 'Complete pseudocode snippets for linked list operations.' },
            4: { title: 'Linked List Quiz', desc: '10-question quiz on all linked list operations.' },
        }
    },
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
        </div>
    )
}

function TreeIntro({ onComplete }) {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-2xl p-6">
                <h3 className="font-display text-xl font-bold text-white mb-5">🌳 Binary Tree Fundamentals</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {[['🌱', 'Root', 'The topmost node — has no parent.'], ['🍃', 'Leaf', 'A node with no children.'], ['📦', 'Node', 'Each element with a value and up to 2 children.'], ['📏', 'Height', 'Edges from root to deepest leaf.'], ['⬅️', 'Left Child', 'Always smaller than parent in a BST.'], ['➡️', 'Right Child', 'Always greater than parent in a BST.']].map(([e, t, d]) => (
                        <div key={t} className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="text-2xl">{e}</span>
                            <div><div className="font-bold text-white text-sm">{t}</div><div className="text-slate-400 text-xs mt-0.5">{d}</div></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass rounded-2xl p-8 text-center">
                <p className="text-slate-400 mb-6">Got it? Let's build an actual BST in Level 2!</p>
                <button onClick={onComplete} className="btn-primary px-8 py-3">Got it → Level 2</button>
            </div>
        </div>
    )
}

function LinkedListConcepts({ onComplete }) {
    const items = [
        ['Singly Linked', 'Each node has one next pointer. Traversal is one-way.', 'O(n)', 'Only forward traversal'],
        ['Doubly Linked', 'Each node has both next and prev pointers. Two-way traversal.', 'O(n)', 'More memory per node'],
        ['Circular Linked', 'Last node points back to head. Used for round-robin scheduling.', 'O(n)', 'Complex to manage'],
    ];
    return (
        <div className="space-y-5 animate-fade-in">
            <h3 className="font-display text-xl font-bold text-white">🔗 Types of Linked Lists</h3>
            {items.map(([type, desc, tc, tradeoff]) => (
                <div key={type} className="glass rounded-2xl p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xl shrink-0">🔗</div>
                    <div className="flex-1">
                        <div className="font-bold text-white mb-1">{type}</div>
                        <div className="text-slate-400 text-sm mb-2">{desc}</div>
                        <div className="flex gap-4 text-xs">
                            <span className="text-emerald-400">Search: {tc}</span>
                            <span className="text-yellow-400">Tradeoff: {tradeoff}</span>
                        </div>
                    </div>
                </div>
            ))}
            <div className="glass rounded-2xl p-5">
                <h4 className="font-bold text-white mb-3">⚡ vs Arrays</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {[['Insert at head', 'O(n) array', 'O(1) linked'], ['Insert at end', 'O(1) array (amortized)', 'O(n) linked'], ['Access by index', 'O(1) array', 'O(n) linked'], ['Delete', 'O(n) array', 'O(1) if node known']].map(([op, a, l]) => (
                        <div key={op} className="glass rounded-xl p-3">
                            <div className="text-slate-400 text-xs mb-1">{op}</div>
                            <div className="text-blue-400 text-xs">Array: {a}</div>
                            <div className="text-orange-400 text-xs">Linked: {l}</div>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={onComplete} className="btn-primary w-full py-3">I understand → Next Level →</button>
        </div>
    )
}

export default function LearningLevel() {
    const { moduleId, levelId } = useParams()
    const lvl = parseInt(levelId)
    const mod = MODULE_META[moduleId]
    const level = mod?.levels[lvl]
    const [showCompletion, setShowCompletion] = useState(false)
    const { markComplete, isCompleted } = useProgress()

    useEffect(() => { setShowCompletion(false) }, [moduleId, levelId])

    if (!mod || !level) return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center text-center px-4">
            <div><div className="text-7xl mb-4">😕</div>
                <h2 className="font-display text-2xl font-bold text-white mb-4">Module not found</h2>
                <Link to="/modules" className="btn-primary">Back to Modules</Link></div>
        </div>
    )

    const totalLevels = Object.keys(mod.levels).length
    const handleComplete = (score = 0, total = 0, perfect = false) => {
        markComplete(moduleId, lvl, score, perfect)
        setShowCompletion(true)
    }

    const isQuizLevel = (moduleId === 'sorting' && lvl === 6) || (moduleId !== 'sorting' && lvl === 4)

    const levelContent = () => {
        if (showCompletion) return (
            <CompletionScreen score={0} total={0} moduleId={moduleId}
                nextLevelId={lvl < totalLevels ? lvl + 1 : null}
                onRetry={() => setShowCompletion(false)} />
        )
        if (isQuizLevel) return <QuizComponent moduleId={moduleId} onComplete={handleComplete} />

        // Sorting
        if (moduleId === 'sorting') {
            if (lvl === 1) return <BubbleSortVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 2) return <InteractiveSorting moduleId={moduleId} levelId={lvl} />
            if (lvl === 3) return <SelectionSortVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 4) return <AlgorithmRace moduleId={moduleId} levelId={lvl} />
            if (lvl === 5) return <SortingSandbox moduleId={moduleId} levelId={lvl} />
        }
        // Stack & Queue
        if (moduleId === 'stack-queue') {
            if (lvl === 1) return <StackVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 2) return <QueueVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 3) return (
                <div className="grid lg:grid-cols-2 gap-6">
                    <div><h3 className="font-display text-white font-bold text-lg mb-4 text-center">Stack (LIFO)</h3><StackVisualizer moduleId={moduleId} levelId={lvl} /></div>
                    <div><h3 className="font-display text-white font-bold text-lg mb-4 text-center">Queue (FIFO)</h3><QueueVisualizer moduleId={moduleId} levelId={lvl} /></div>
                </div>
            )
        }
        // Trees
        if (moduleId === 'trees') {
            if (lvl === 1) return <TreeIntro onComplete={handleComplete} />
            if (lvl === 2) return <TreeVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 3) return <TraversalVisualizer moduleId={moduleId} levelId={lvl} />
        }
        // Linked List
        if (moduleId === 'linked-list') {
            if (lvl === 1) return <LinkedListVisualizer moduleId={moduleId} levelId={lvl} />
            if (lvl === 2) return <LinkedListConcepts onComplete={handleComplete} />
            if (lvl === 3) return <CodeFillChallenge moduleId={moduleId} levelId={lvl} />
        }
        return null
    }

    return (
        <div className="min-h-screen bg-dark-950 bg-grid pt-20 pb-20">
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-5 blur-3xl"
                style={{ background: `radial-gradient(circle, ${mod.glow}, transparent)` }} />

            <div className="max-w-6xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link to="/" className="hover:text-primary-400 transition-colors">Home</Link><span>/</span>
                    <Link to="/modules" className="hover:text-primary-400 transition-colors">Modules</Link><span>/</span>
                    <Link to={`/module/${moduleId}/level/1`} className="hover:text-primary-400 transition-colors">{mod.title}</Link><span>/</span>
                    <span className="text-slate-300 font-medium">Level {lvl}</span>
                </div>

                {/* Header */}
                <div className="glass rounded-2xl p-6 mb-8 overflow-hidden relative">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`} />
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-3xl shadow-lg`}>{mod.icon}</div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">{mod.title}</p>
                                <h1 className="font-display text-xl font-bold text-white">{level.title}</h1>
                                <p className="text-slate-400 text-sm mt-0.5">{level.desc}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {Object.keys(mod.levels).map(l => {
                                const ln = parseInt(l)
                                return (
                                    <Link key={l} to={`/module/${moduleId}/level/${l}`}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${ln === lvl ? `bg-gradient-to-br ${mod.color} text-white border-transparent` :
                                                isCompleted(moduleId, ln) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                                                    'bg-white/5 border-white/10 text-slate-500'
                                            }`}>
                                        {isCompleted(moduleId, ln) ? '✓' : l}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="glass rounded-2xl p-6 md:p-8">
                    <Suspense fallback={<LoadingSpinner />}>
                        {levelContent()}
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
