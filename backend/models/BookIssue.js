const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  fine: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['issued', 'returned', 'overdue'],
    default: 'issued'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: String
}, {
  timestamps: true
});

// Calculate fine for overdue books
bookIssueSchema.methods.calculateFine = function() {
  if (this.status === 'returned' || !this.dueDate) return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today > dueDate) {
    const overdueDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    return overdueDays * 5; // ₹5 per day fine
  }
  
  return 0;
};

module.exports = mongoose.model('BookIssue', bookIssueSchema);