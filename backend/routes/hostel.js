const express = require('express');
const Hostel = require('../models/Hostel');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Create hostel/block (admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const hostel = await Hostel.create(req.body);
    res.json({ success: true, hostel });
  } catch (error) {
    console.error('Create hostel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List hostels
router.get('/', auth, checkVerification, async (req, res) => {
  try {
    const hostels = await Hostel.find();
    res.json({ success: true, hostels });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Allocate student to room
router.post('/:id/allocate', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, studentId } = req.body;
    const hostel = await Hostel.findById(id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    const room = hostel.rooms.find(r => r.number === roomNumber);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.occupants.length >= room.capacity) return res.status(400).json({ message: 'Room full' });
    if (!room.occupants.includes(studentId)) room.occupants.push(studentId);
    await hostel.save();
    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Visitor log
router.post('/:id/visitor', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { student, name, relation, checkIn, checkOut, idProof } = req.body;
    const hostel = await Hostel.findById(id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    hostel.visitors.push({ student, name, relation, checkIn, checkOut, idProof });
    await hostel.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


