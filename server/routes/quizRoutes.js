const express = require('express');
const router = express.Router();
const { getQuizByModule, submitQuiz } = require('../controllers/quizController');

router.get('/:moduleId', getQuizByModule);
router.post('/submit', submitQuiz);

module.exports = router;
