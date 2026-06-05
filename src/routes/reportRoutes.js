const express = require('express');
const router = express.Router();
const { getDashboard, getProjectReport, getPaymentsReport, getExpensesReport, getLabourReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/project/:projectId', getProjectReport);
router.get('/payments', getPaymentsReport);
router.get('/expenses', getExpensesReport);
router.get('/labour', getLabourReport);

module.exports = router;
