const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '📚'
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    levels: [{
        levelId: Number,
        title: String,
        type: {
            type: String,
            enum: ['concept', 'interactive', 'practice', 'quiz']
        },
        description: String,
        content: mongoose.Schema.Types.Mixed
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Module', ModuleSchema);
