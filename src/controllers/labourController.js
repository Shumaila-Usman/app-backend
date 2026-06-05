const Labour = require('../models/Labour');

// @desc    Get all labour records for user
// @route   GET /api/labour
// @access  Private
const getLabour = async (req, res) => {
  try {
    const { projectId, search } = req.query;
    const query = { userId: req.user._id };

    if (projectId) query.projectId = projectId;
    if (search) {
      query.$or = [
        { labourName: { $regex: search, $options: 'i' } },
        { labourType: { $regex: search, $options: 'i' } },
      ];
    }

    const labour = await Labour.find(query)
      .populate('projectId', 'name clientName')
      .sort({ createdAt: -1 });

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

// @desc    Create labour record
// @route   POST /api/labour
// @access  Private
const createLabour = async (req, res) => {
  try {
    const { projectId, labourName, labourType, dailyRate, numberOfDays, paidAmount, date, notes } = req.body;

    if (!projectId || !labourName || dailyRate === undefined || numberOfDays === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Project, labour name, daily rate, and number of days are required',
      });
    }

    const labour = await Labour.create({
      userId: req.user._id,
      projectId,
      labourName,
      labourType: labourType || 'General Labour',
      dailyRate: parseFloat(dailyRate),
      numberOfDays: parseFloat(numberOfDays),
      paidAmount: parseFloat(paidAmount) || 0,
      date: date || new Date(),
      notes,
    });

    const populated = await Labour.findById(labour._id).populate('projectId', 'name clientName');

    res.status(201).json({ success: true, message: 'Labour record added successfully', data: { labour: populated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single labour record
// @route   GET /api/labour/:id
// @access  Private
const getLabourById = async (req, res) => {
  try {
    const labour = await Labour.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'name clientName location');

    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour record not found' });
    }

    res.json({ success: true, data: { labour } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update labour record
// @route   PUT /api/labour/:id
// @access  Private
const updateLabour = async (req, res) => {
  try {
    const existing = await Labour.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Labour record not found' });
    }

    const dailyRate = parseFloat(req.body.dailyRate ?? existing.dailyRate);
    const numberOfDays = parseFloat(req.body.numberOfDays ?? existing.numberOfDays);
    const paidAmount = parseFloat(req.body.paidAmount ?? existing.paidAmount);
    const totalAmount = dailyRate * numberOfDays;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const labour = await Labour.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, dailyRate, numberOfDays, paidAmount, totalAmount, remainingAmount },
      { new: true, runValidators: true }
    ).populate('projectId', 'name clientName');

    res.json({ success: true, message: 'Labour record updated successfully', data: { labour } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete labour record
// @route   DELETE /api/labour/:id
// @access  Private
const deleteLabour = async (req, res) => {
  try {
    const labour = await Labour.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour record not found' });
    }

    res.json({ success: true, message: 'Labour record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLabour, createLabour, getLabourById, updateLabour, deleteLabour };
