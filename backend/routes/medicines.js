const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.use(authMiddleware, ownerOnly);

router.get('/', getAllMedicines);
router.get('/:id', getMedicineById);
router.post('/', createMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;
