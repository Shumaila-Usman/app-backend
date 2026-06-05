const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    labourName: {
      type: String,
      required: [true, 'Labour name is required'],
      trim: true,
    },
    labourType: {
      type: String,
      trim: true,
      default: 'General Labour',
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: 0,
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
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

// Auto-calculate totalAmount and remainingAmount before saving
labourSchema.pre('save', function (next) {
  this.totalAmount = this.dailyRate * this.numberOfDays;
  this.remainingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  next();
});

// Indexes
labourSchema.index({ userId: 1 });
labourSchema.index({ projectId: 1 });
labourSchema.index({ date: -1 });
labourSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Labour', labourSchema);
