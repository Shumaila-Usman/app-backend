const express = require('express');
const router = express.Router();
const { getPayments, createPayment, getPayment, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getPayments).post(createPayment);
router.route('/:id').get(getPayment).put(updatePayment).delete(deletePayment);

module.exports = router;
