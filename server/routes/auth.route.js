const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const authMiddle = require('../middlewares/auth.middleware');

router.post('/login', controller.login);
router.post('/logout', authMiddle.requireAuth, controller.logout);
module.exports = router;
