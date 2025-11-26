const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const AcademicCalendar = require('../models/AcademicCalendar');

const router = express.Router();

// Get active academic calendar
router.get('/', auth, async (req, res) => {
  try {
    const cal = await AcademicCalendar.findOne({ isActive: true }).lean();
    if (!cal) return res.json({ success: true, calendar: null });
    res.json({ success: true, calendar: cal });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar' });
  }
});

// Create new academic calendar (admin only)
router.post('/', auth, authorize(['admin']), async (req, res) => {
  try {
    // If setting as active, deactivate all other calendars
    if (req.body.isActive) {
      await AcademicCalendar.updateMany({}, { isActive: false });
    }
    
    const calendar = new AcademicCalendar(req.body);
    await calendar.save();
    
    res.status(201).json({ success: true, calendar });
  } catch (error) {
    console.error('Create calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to create calendar' });
  }
});

// Update academic calendar (admin only)
router.put('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // If setting as active, deactivate all other calendars
    if (req.body.isActive) {
      await AcademicCalendar.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    
    const calendar = await AcademicCalendar.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Calendar not found' });
    }
    
    res.json({ success: true, calendar });
  } catch (error) {
    console.error('Update calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to update calendar' });
  }
});

// Delete academic calendar (admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await AcademicCalendar.findByIdAndDelete(id);
    
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Calendar not found' });
    }
    
    res.json({ success: true, message: 'Calendar deleted successfully' });
  } catch (error) {
    console.error('Delete calendar error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete calendar' });
  }
});

module.exports = router;


