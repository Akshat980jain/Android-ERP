const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: String,
  relation: String,
  checkIn: Date,
  checkOut: Date,
  idProof: String,
});

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true },
  capacity: { type: Number, default: 2 },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  block: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'coed'], default: 'coed' },
  rooms: [roomSchema],
  visitors: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ...visitorSchema.obj
  }],
}, { timestamps: true });

hostelSchema.index({ name: 1, block: 1 }, { unique: true });

module.exports = mongoose.model('Hostel', hostelSchema);


