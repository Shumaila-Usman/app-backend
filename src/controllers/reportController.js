const Project = require('../models/Project');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Labour = require('../models/Labour');
const Contractor = require('../models/Contractor');

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [projects, payments, expenses, labour] = await Promise.all([
      Project.find({ userId }),
      Payment.find({ userId }).populate('projectId', 'name').populate('contractorId', 'name').sort({ createdAt: -1 }),
      Expense.find({ userId }).populate('projectId', 'name').sort({ createdAt: -1 }),
      Labour.find({ userId }),
    ]);

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaymentRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
    const totalLabourRemaining = labour.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalRemaining = totalPaymentRemaining + totalLabourRemaining;

    const recentPayments = payments.slice(0, 5);
    const recentExpenses = expenses.slice(0, 5);

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        totalPaid,
        totalExpenses,
        totalRemaining,
        recentPayments,
        recentExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get project summary report
// @route   GET /api/reports/project/:projectId
// @access  Private
const getProjectReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [payments, expenses, labour, contractors] = await Promise.all([
      Payment.find({ projectId, userId }).populate('contractorId', 'name type'),
      Expense.find({ projectId, userId }),
      Labour.find({ projectId, userId }),
      Contractor.find({ projectId, userId }),
    ]);

    const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalPaymentRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLabourCost = labour.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalLabourPaid = labour.reduce((sum, l) => sum + l.paidAmount, 0);
    const totalLabourRemaining = labour.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalRemaining = totalPaymentRemaining + totalLabourRemaining;

    // Expense breakdown by category
    const expenseByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Payment breakdown by status
    const paymentByStatus = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        project,
        summary: {
          estimatedBudget: project.estimatedBudget,
          totalPayments,
          totalPaid,
          totalPaymentRemaining,
          totalExpenses,
          totalLabourCost,
          totalLabourPaid,
          totalLabourRemaining,
          totalRemaining,
          totalContractors: contractors.length,
        },
        expenseByCategory,
        paymentByStatus,
        payments,
        expenses,
        labour,
        contractors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payments report
// @route   GET /api/reports/payments
// @access  Private
const getPaymentsReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({ userId })
      .populate('projectId', 'name')
      .populate('contractorId', 'name type')
      .sort({ paymentDate: -1 });

    const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);

    const byStatus = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + p.paidAmount;
      return acc;
    }, {});

    const byMethod = payments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.paidAmount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        payments,
        summary: { totalAmount, totalPaid, totalRemaining },
        byStatus,
        byMethod,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expenses report
// @route   GET /api/reports/expenses
// @access  Private
const getExpensesReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const expenses = await Expense.find({ userId })
      .populate('projectId', 'name')
      .sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const byProject = expenses.reduce((acc, e) => {
      const projectName = e.projectId?.name || 'Unknown';
      acc[projectName] = (acc[projectName] || 0) + e.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        expenses,
        summary: { totalExpenses },
        byCategory,
        byProject,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get labour report
// @route   GET /api/reports/labour
// @access  Private
const getLabourReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const labour = await Labour.find({ userId })
      .populate('projectId', 'name')
      .sort({ date: -1 });

    const totalLabourCost = labour.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalPaid = labour.reduce((sum, l) => sum + l.paidAmount, 0);
    const totalRemaining = labour.reduce((sum, l) => sum + l.remainingAmount, 0);

    res.json({
      success: true,
      data: {
        labour,
        summary: { totalLabourCost, totalPaid, totalRemaining },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getProjectReport, getPaymentsReport, getExpensesReport, getLabourReport };
