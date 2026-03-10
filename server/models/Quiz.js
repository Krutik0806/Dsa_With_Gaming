const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    moduleId: { type: String, required: true },
    questions: [
        {
            question: { type: String, required: true },
            options: [{ type: String }],
            correctIndex: { type: Number, required: true },
            explanation: { type: String }
        }
    ]
});

module.exports = mongoose.model('Quiz', QuizSchema);
