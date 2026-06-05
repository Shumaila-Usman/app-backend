const Project = require('../models/Project');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Labour = require('../models/Labour');
const Contractor = require('../models/Contractor');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    // Enrich each project with financial summary
    const enriched = await Promise.all(
      projects.map(async (project) => {
        const [payments, expenses, labour] = await Promise.all([
          Payment.find({ projectId: project._id }),
          Expense.find({ projectId: project._id }),
          Labour.find({ projectId: project._id }),
        ]);

        const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalPaymentRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
        const totalLabourRemaining = labour.reduce((sum, l) => sum + l.remainingAmount, 0);
        const totalRemaining = totalPaymentRemaining + totalLabourRemaining;

        return {
          ...project.toObject(),
          totalPaid,
          totalExpenses,
          totalRemaining,
        };
      })
    );

    res.json({ success: true, data: { projects: enriched } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, clientName, location, projectType, estimatedBudget, startDate, endDate, status, notes } = req.body;

    if (!name || !clientName) {
      return res.status(400).json({ success: false, message: 'Project name and client name are required' });
    }

    const project = await Project.create({
      userId: req.user._id,
      name,
      clientName,
      location,
      projectType,
      estimatedBudget: estimatedBudget || 0,
      startDate,
      endDate,
      status: status || 'active',
      notes,
    });

    res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const [payments, expenses, labour, contractors] = await Promise.all([
      Payment.find({ projectId: project._id }).populate('contractorId', 'name phone type category').sort({ createdAt: -1 }),
      Expense.find({ projectId: project._id }).sort({ createdAt: -1 }),
      Labour.find({ projectId: project._id }).sort({ createdAt: -1 }),
      Contractor.find({ projectId: project._id }).sort({ createdAt: -1 }),
    ]);

    const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaymentRemaining = payments.reduce((sum, p) => sum + p.remainingAmount, 0);
    const totalLabourRemaining = labour.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalRemaining = totalPaymentRemaining + totalLabourRemaining;

    res.json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          totalPaid,
          totalExpenses,
          totalRemaining,
        },
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

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project updated successfully', data: { project } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Cascade delete related records
    await Promise.all([
      Payment.deleteMany({ projectId: req.params.id }),
      Expense.deleteMany({ projectId: req.params.id }),
      Labour.deleteMany({ projectId: req.params.id }),
      Contractor.deleteMany({ projectId: req.params.id }),
    ]);

    res.json({ success: true, message: 'Project and all related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };
