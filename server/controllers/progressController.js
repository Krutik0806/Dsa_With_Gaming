const Progress = require('../models/Progress');

exports.getProgress = async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });
        const progress = await Progress.find({ sessionId }, '-__v');
        res.json({ success: true, data: progress });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.saveProgress = async (req, res) => {
    try {
        const { sessionId, moduleId, levelId, completed, score } = req.body;
        const progress = await Progress.findOneAndUpdate(
            { sessionId, moduleId, levelId },
            { completed, score, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: progress });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
