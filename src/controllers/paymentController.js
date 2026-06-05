const Payment = require('../models/Payment');

// @desc    Get all payments for user
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const { status, projectId, contractorId, search } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (projectId) query.projectId = projectId;
    if (contractorId) query.contractorId = contractorId;
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }];
    }

    const payments = await Payment.find(query)
      .populate('projectId', 'name clientName')
      .populate('contractorId', 'name phone type category')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const {
      projectId,
      contractorId,
      title,
      totalAmount,
      paidAmount,
      paymentMethod,
      paymentDate,
      notes,
      receiptImageUrl,
    } = req.body;

    if (!projectId || !title || totalAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Project, title, and total amount are required' });
    }

    const paid = parseFloat(paidAmount) || 0;
    const total = parseFloat(totalAmount);

    if (paid > total) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot exceed total amount' });
    }

    const payment = await Payment.create({
      userId: req.user._id,
      projectId,
      contractorId: contractorId || null,
      title,
      totalAmount: total,
      paidAmount: paid,
      paymentMethod: paymentMethod || 'Cash',
      paymentDate: paymentDate || new Date(),
      notes,
      receiptImageUrl: receiptImageUrl || '',
    });

    const populated = await Payment.findById(payment._id)
      .populate('projectId', 'name clientName')
      .populate('contractorId', 'name phone type category');

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment: populated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'name clientName location')
      .populate('contractorId', 'name phone type category');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const existing = await Payment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const total = parseFloat(req.body.totalAmount ?? existing.totalAmount);
    const paid = parseFloat(req.body.paidAmount ?? existing.paidAmount);

    if (paid > total) {
      return res.status(400).json({ success: false, message: 'Paid amount cannot exceed total amount' });
    }

    const remaining = Math.max(0, total - paid);
    let status = 'Pending';
    if (paid === 0) status = 'Pending';
    else if (paid >= total) status = 'Paid';
    else status = 'Partial';

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, totalAmount: total, paidAmount: paid, remainingAmount: remaining, status },
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name clientName')
      .populate('contractorId', 'name phone type category');

    res.json({ success: true, message: 'Payment updated successfully', data: { payment } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPayments, createPayment, getPayment, updatePayment, deletePayment };
