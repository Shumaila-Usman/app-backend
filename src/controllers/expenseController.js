const Expense = require('../models/Expense');

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { category, projectId, search } = req.query;
    const query = { userId: req.user._id };

    if (category) query.category = category;
    if (projectId) query.projectId = projectId;
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }];
    }

    const expenses = await Expense.find(query)
      .populate('projectId', 'name clientName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { expenses } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { projectId, title, category, amount, date, paymentMethod, notes, receiptImageUrl } = req.body;

    if (!projectId || !title || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Project, title, and amount are required' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      projectId,
      title,
      category: category || 'Other',
      amount: parseFloat(amount),
      date: date || new Date(),
      paymentMethod: paymentMethod || 'Cash',
      notes,
      receiptImageUrl: receiptImageUrl || '',
    });

    const populated = await Expense.findById(expense._id).populate('projectId', 'name clientName');

    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: { expense: populated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'name clientName location');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, data: { expense } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'name clientName');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense updated successfully', data: { expense } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExpenses, createExpense, getExpense, updateExpense, deleteExpense };
