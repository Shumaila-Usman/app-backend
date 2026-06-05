const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contractor',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Payment title is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: [true, 'Paid amount is required'],
      min: 0,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Raast', 'Easypaisa', 'JazzCash', 'Cheque', 'Other'],
      default: 'Cash',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending'],
      default: 'Pending',
    },
    receiptImageUrl: {
      type: String,
      default: '',
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

// Auto-calculate remainingAmount and status before saving
paymentSchema.pre('save', function (next) {
  this.remainingAmount = Math.max(0, this.totalAmount - this.paidAmount);

  if (this.paidAmount === 0) {
    this.status = 'Pending';
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'Paid';
    this.remainingAmount = 0;
  } else {
    this.status = 'Partial';
  }

  next();
});

// Also handle findOneAndUpdate
paymentSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.totalAmount !== undefined || update.paidAmount !== undefined) {
    const total = update.totalAmount ?? 0;
    const paid = update.paidAmount ?? 0;
    update.remainingAmount = Math.max(0, total - paid);

    if (paid === 0) {
      update.status = 'Pending';
    } else if (paid >= total) {
      update.status = 'Paid';
      update.remainingAmount = 0;
    } else {
      update.status = 'Partial';
    }
  }
  next();
});

// Indexes
paymentSchema.index({ userId: 1 });
paymentSchema.index({ projectId: 1 });
paymentSchema.index({ contractorId: 1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
