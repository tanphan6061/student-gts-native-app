const express = require('express');
const router = express.Router();
const controller = require('../controllers/schedule.controller');
const authMiddle = require('../middlewares/auth.middleware');

router.post('/week', authMiddle.requireAuth, controller.getScheduleWeekByDate);

module.exports = router;
