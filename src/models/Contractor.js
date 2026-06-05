const mongoose = require('mongoose');

const contractorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Contractor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['Contractor', 'Supplier', 'Labour'],
      required: [true, 'Type is required'],
    },
    category: {
      type: String,
      enum: [
        'Mason',
        'Electrician',
        'Plumber',
        'Painter',
        'Cement Supplier',
        'Steel Supplier',
        'Carpenter',
        'Labour',
        'Other',
      ],
      default: 'Other',
    },
    totalContractAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contractorSchema.index({ userId: 1 });
contractorSchema.index({ projectId: 1 });
contractorSchema.index({ userId: 1, type: 1 });
contractorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contractor', contractorSchema);
