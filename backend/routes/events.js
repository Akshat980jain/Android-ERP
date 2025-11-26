const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// Get events
router.get('/', auth, checkVerification, async (req, res) => {
  try {
    const { eventType, status, upcoming } = req.query;
    
    let query = {};
    
    // Filter by event type
    if (eventType) query.eventType = eventType;
    
    // Filter by status
    if (status) query.status = status;
    else query.status = { $in: ['published', 'ongoing'] }; // Default to active events
    
    // Filter upcoming events
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    // Check eligibility for students
    if (req.user.role === 'student') {
      query.$or = [
        { eligibleRoles: { $in: ['student'] } },
        { eligibleRoles: { $size: 0 } },
        { isPublic: true }
      ];
      
      if (req.user.department) {
        query.$and = [
          {
            $or: [
              { eligibleDepartments: { $in: [req.user.department] } },
              { eligibleDepartments: { $size: 0 } }
            ]
          }
        ];
      }
    }

    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });

    // Add registration status for students
    if (req.user.role === 'student') {
      const eventsWithStatus = events.map(event => {
        const registration = event.registrations.find(
          reg => reg.participant.toString() === req.user._id.toString()
        );
        return {
          ...event.toObject(),
          isRegistered: !!registration,
          registrationStatus: registration?.status,
          canRegister: event.maxParticipants ? event.registrations.length < event.maxParticipants : true
        };
      });
      return res.json({ events: eventsWithStatus });
    }

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (Admin/Faculty)
router.post('/', auth, authorize('admin', 'faculty'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('eventType').isIn(['workshop', 'seminar', 'conference', 'cultural', 'sports', 'academic', 'placement', 'other']),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('venue').trim().notEmpty().withMessage('Venue is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, eventType, startDate, endDate, venue, maxParticipants,
      registrationDeadline, eligibleRoles, eligibleDepartments, eligiblePrograms,
      speakers, agenda, registrationFee, isPublic
    } = req.body;

    const event = new Event({
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      venue,
      organizer: req.user._id,
      maxParticipants,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      eligibleRoles: eligibleRoles || [],
      eligibleDepartments: eligibleDepartments || [],
      eligiblePrograms: eligiblePrograms || [],
      speakers: speakers || [],
      agenda: agenda || [],
      registrationFee: registrationFee || 0,
      isPublic: isPublic || false,
      status: 'published'
    });

    await event.save();
    await event.populate('organizer', 'firstName lastName');

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event (Student)
router.post('/:eventId/register', auth, authorize('student'), checkVerification, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event registration is not open' });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existingRegistration = event.registrations.find(
      reg => reg.participant.toString() === req.user._id.toString()
    );

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check capacity
    if (event.maxParticipants && event.registrations.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check eligibility
    if (event.eligibleRoles.length > 0 && !event.eligibleRoles.includes(req.user.role)) {
      return res.status(400).json({ message: 'Not eligible for this event' });
    }

    if (event.eligibleDepartments.length > 0 && !event.eligibleDepartments.includes(req.user.department)) {
      return res.status(400).json({ message: 'Not eligible for this event (department)' });
    }

    event.registrations.push({
      participant: req.user._id
    });

    await event.save();

    res.json({ message: 'Registered for event successfully' });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event registrations (Organizer/Admin)
router.get('/:eventId/registrations', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('registrations.participant', 'firstName lastName studentId email department');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ 
      event: {
        title: event.title,
        maxParticipants: event.maxParticipants,
        registrationCount: event.registrations.length
      },
      registrations: event.registrations 
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;