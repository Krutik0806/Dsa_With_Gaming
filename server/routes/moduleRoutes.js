const express = require('express');
const router = express.Router();
const { getAllModules, getModuleById } = require('../controllers/moduleController');

router.get('/', getAllModules);
router.get('/:id', getModuleById);

module.exports = router;
