const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['tuition', 'library', 'lab', 'examination', 'hostel', 'transport', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'waived'],
    default: 'pending'
  },
  semester: String,
  academicYear: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque']
  },
  transactionId: String,
  receipt: String,
  lateFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);