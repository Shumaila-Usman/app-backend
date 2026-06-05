const Contractor = require('../models/Contractor');
const Payment = require('../models/Payment');

// @desc    Get all contractors for user
// @route   GET /api/contractors
// @access  Private
const getContractors = async (req, res) => {
  try {
    const { type, projectId, search } = req.query;
    const query = { userId: req.user._id };

    if (type) query.type = type;
    if (projectId) query.projectId = projectId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const contractors = await Contractor.find(query)
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    // Enrich with payment summary
    const enriched = await Promise.all(
      contractors.map(async (contractor) => {
        const payments = await Payment.find({ contractorId: contractor._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
        const totalRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
        const totalBill = contractor.totalContractAmount || payments.reduce((sum, p) => sum + p.totalAmount, 0);

        return {
          ...contractor.toObject(),
          totalPaid,
          totalRemaining,
          totalBill,
        };
      })
    );

    res.json({ success: true, data: { contractors: enriched } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create contractor
// @route   POST /api/contractors
// @access  Private
const createContractor = async (req, res) => {
  try {
    const { name, phone, type, category, projectId, totalContractAmount, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }

    const contractor = await Contractor.create({
      userId: req.user._id,
      name,
      phone,
      type,
      category: category || 'Other',
      projectId: projectId || null,
      totalContractAmount: totalContractAmount || 0,
      notes,
    });

    const populated = await Contractor.findById(contractor._id).populate('projectId', 'name');

    res.status(201).json({ success: true, message: 'Contractor added successfully', data: { contractor: populated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single contractor
// @route   GET /api/contractors/:id
// @access  Private
const getContractor = async (req, res) => {
  try {
    const contractor = await Contractor.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'name clientName');

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    const payments = await Payment.find({ contractorId: contractor._id })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
    const totalBill = contractor.totalContractAmount || payments.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({
      success: true,
      data: {
        contractor: {
          ...contractor.toObject(),
          totalPaid,
          totalRemaining,
          totalBill,
        },
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update contractor
// @route   PUT /api/contractors/:id
// @access  Private
const updateContractor = async (req, res) => {
  try {
    const contractor = await Contractor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'name');

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    res.json({ success: true, message: 'Contractor updated successfully', data: { contractor } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contractor
// @route   DELETE /api/contractors/:id
// @access  Private
const deleteContractor = async (req, res) => {
  try {
    const contractor = await Contractor.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    res.json({ success: true, message: 'Contractor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getContractors, createContractor, getContractor, updateContractor, deleteContractor };
