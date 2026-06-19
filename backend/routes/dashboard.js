const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.use(authMiddleware, ownerOnly);

router.get('/stats', getDashboardStats);

module.exports = router;
