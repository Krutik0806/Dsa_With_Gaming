const express = require('express');
const router = express.Router();
const { getProgress, saveProgress } = require('../controllers/progressController');

router.get('/', getProgress);
router.post('/save', saveProgress);

module.exports = router;
