const express = require('express');
const router = express.Router();
const { createSale, getAllSales, getSaleById } = require('../controllers/salesController');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.use(authMiddleware, ownerOnly);

router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.post('/', createSale);

module.exports = router;
