const Quiz = require('../models/Quiz');

exports.getQuizByModule = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ moduleId: req.params.moduleId }, '-__v');
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        // Strip correctIndex before sending to client
        const safeQuestions = quiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            explanation: q.explanation
        }));
        res.json({ success: true, data: { moduleId: quiz.moduleId, questions: safeQuestions } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.submitQuiz = async (req, res) => {
    try {
        const { moduleId, answers } = req.body; // answers: [0, 2, 1, ...]
        const quiz = await Quiz.findOne({ moduleId });
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        let score = 0;
        const results = quiz.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            if (isCorrect) score++;
            return { isCorrect, correctIndex: q.correctIndex, explanation: q.explanation };
        });

        res.json({
            success: true,
            data: {
                score,
                total: quiz.questions.length,
                percentage: Math.round((score / quiz.questions.length) * 100),
                results
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
