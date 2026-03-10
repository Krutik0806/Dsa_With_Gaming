const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    moduleId: { type: String, required: true },
    levelId: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

ProgressSchema.index({ sessionId: 1, moduleId: 1, levelId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
