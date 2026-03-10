import { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();
export const useProgress = () => useContext(ProgressContext);

const ACHIEVEMENTS = [
    { id: 'first_blood', icon: '🎯', title: 'First Blood', desc: 'Complete your very first level', xp: 50 },
    { id: 'bubble_master', icon: '🫧', title: 'Bubble Master', desc: 'Complete Bubble Sort concept level', xp: 75 },
    { id: 'sorter', icon: '🔄', title: 'Sort It Out', desc: 'Complete all 4 sorting levels', xp: 150 },
    { id: 'stacker', icon: '📚', title: 'Stack Overflow', desc: 'Complete Stack & Queue module', xp: 150 },
    { id: 'tree_hugger', icon: '🌳', title: 'Tree Hugger', desc: 'Complete Trees module', xp: 150 },
    { id: 'scholar', icon: '🎓', title: 'DSA Scholar', desc: 'Complete ALL three modules', xp: 500 },
    { id: 'perfect_quiz', icon: '💯', title: 'Perfect Score', desc: 'Score 100% on any quiz', xp: 200 },
    { id: 'speed_demon', icon: '⚡', title: 'Speed Demon', desc: 'Sort in under 10 moves on interactive mode', xp: 100 },
    { id: 'no_mistakes', icon: '❤️', title: 'Flawless', desc: 'Complete a quiz without losing a heart', xp: 125 },
    { id: 'persistent', icon: '🔥', title: 'Persistent', desc: 'Reach a 3-day streak', xp: 100 },
];

const XP_PER_LEVEL = { 1: 50, 2: 75, 3: 75, 4: 100 };

const getSessionId = () => {
    let id = localStorage.getItem('dsa_session_id');
    if (!id) { id = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now(); localStorage.setItem('dsa_session_id', id); }
    return id;
};

const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const ProgressProvider = ({ children }) => {
    const [progress, setProgress] = useState(() => load('dsa_progress', {}));
    const [xp, setXp] = useState(() => load('dsa_xp', 0));
    const [achievements, setAchievements] = useState(() => load('dsa_achievements', []));
    const [streak, setStreak] = useState(() => load('dsa_streak', { count: 0, lastDate: null }));
    const [newAchiev, setNewAchiev] = useState(null);   // toast
    const sessionId = getSessionId();

    // Streak logic on mount
    useEffect(() => {
        const today = new Date().toDateString();
        const s = load('dsa_streak', { count: 0, lastDate: null });
        if (s.lastDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newCount = s.lastDate === yesterday ? s.count + 1 : 1;
        const updated = { count: newCount, lastDate: today };
        setStreak(updated);
        save('dsa_streak', updated);
    }, []);

    const addXP = (amount) => {
        setXp(prev => { const n = prev + amount; save('dsa_xp', n); return n; });
    };

    const unlockAchievement = (id) => {
        setAchievements(prev => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            save('dsa_achievements', updated);
            const a = ACHIEVEMENTS.find(a => a.id === id);
            if (a) { addXP(a.xp); setNewAchiev(a); setTimeout(() => setNewAchiev(null), 4000); }
            return updated;
        });
    };

    const markComplete = (moduleId, levelId, score = 0, quizPerfect = false, fastSort = false) => {
        const key = `${moduleId}-${levelId}`;
        const wasCompleted = progress[key]?.completed;
        const updated = { ...progress, [key]: { completed: true, score } };
        setProgress(updated);
        save('dsa_progress', updated);

        if (!wasCompleted) {
            addXP(XP_PER_LEVEL[levelId] || 50);

            // Achievements
            const totalDone = Object.values(updated).filter(v => v.completed).length;
            if (totalDone === 1) unlockAchievement('first_blood');
            if (moduleId === 'sorting' && levelId === 1) unlockAchievement('bubble_master');

            const sortingDone = [1, 2, 3, 4].every(l => updated[`sorting-${l}`]?.completed);
            const stackDone = [1, 2, 3, 4].every(l => updated[`stack-queue-${l}`]?.completed);
            const treesDone = [1, 2, 3, 4].every(l => updated[`trees-${l}`]?.completed);
            if (sortingDone) unlockAchievement('sorter');
            if (stackDone) unlockAchievement('stacker');
            if (treesDone) unlockAchievement('tree_hugger');
            if (sortingDone && stackDone && treesDone) unlockAchievement('scholar');
        }
        if (quizPerfect) unlockAchievement('perfect_quiz');
        if (fastSort) unlockAchievement('speed_demon');
        if (streak.count >= 3) unlockAchievement('persistent');
    };

    const markFlawless = () => unlockAchievement('no_mistakes');

    const isCompleted = (moduleId, levelId) => progress[`${moduleId}-${levelId}`]?.completed === true;
    const getScore = (moduleId, levelId) => progress[`${moduleId}-${levelId}`]?.score ?? 0;
    const getModuleProgress = (moduleId, total) => {
        let done = 0;
        for (let i = 1; i <= total; i++) if (isCompleted(moduleId, i)) done++;
        return Math.round((done / total) * 100);
    };
    const getLevel = () => {
        if (xp >= 1000) return { level: 5, title: 'DSA Legend', next: Infinity };
        if (xp >= 600) return { level: 4, title: 'Expert', next: 1000 };
        if (xp >= 300) return { level: 3, title: 'Advanced', next: 600 };
        if (xp >= 100) return { level: 2, title: 'Learner', next: 300 };
        return { level: 1, title: 'Beginner', next: 100 };
    };

    return (
        <ProgressContext.Provider value={{
            progress, xp, achievements, streak, newAchiev,
            markComplete, markFlawless, isCompleted, getScore,
            getModuleProgress, getLevel, ACHIEVEMENTS, addXP
        }}>
            {children}
            {/* Achievement Toast */}
            {newAchiev && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-up"
                    style={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 20px 60px rgba(245,158,11,0.3)', maxWidth: 300 }}>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{newAchiev.icon}</span>
                        <div>
                            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-0.5">Achievement Unlocked!</div>
                            <div className="text-white font-bold">{newAchiev.title}</div>
                            <div className="text-slate-400 text-xs mt-0.5">{newAchiev.desc}</div>
                            <div className="text-yellow-400 text-xs font-bold mt-1">+{newAchiev.xp} XP</div>
                        </div>
                    </div>
                </div>
            )}
        </ProgressContext.Provider>
    );
};
