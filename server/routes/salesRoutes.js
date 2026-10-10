const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', salesController.getAllSales);
router.post('/', salesController.addSale);
router.patch('/:id/status', salesController.updatePassStatus);
router.post('/bulk-status', salesController.bulkUpdatePassStatus);
router.put('/:id', salesController.updateSale);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
