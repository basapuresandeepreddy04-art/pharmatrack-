const express = require('express');
const router = express.Router();
const { getAllAlerts, markAlertRead, markAllRead, getAlertStats } = require('../controllers/alertController');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.use(authMiddleware, ownerOnly);

router.get('/stats', getAlertStats);
router.get('/', getAllAlerts);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markAlertRead);

module.exports = router;
