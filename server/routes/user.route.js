const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authMiddle = require('../middlewares/auth.middleware');

router.get('/scores', authMiddle.requireAuth, controller.getOverallScores);

module.exports = router;
