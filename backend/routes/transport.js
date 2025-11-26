const express = require('express');
const { body, validationResult } = require('express-validator');
const Transport = require('../models/Transport');
const { auth, authorize, checkVerification } = require('../middleware/auth');

const router = express.Router();

// GPS trace ingest (Admin/Driver)
router.post('/routes/:routeId/gps', auth, authorize('admin'), async (req, res) => {
  try {
    const { routeId } = req.params;
    const { latitude, longitude, timestamp } = req.body;
    const route = await Transport.findById(routeId);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    // Lightweight: attach last known location
    route.lastLocation = { latitude, longitude, timestamp: timestamp ? new Date(timestamp) : new Date() };
    await route.save();
    res.json({ success: true });
  } catch (error) {
    console.error('GPS ingest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Live ETA per stop (basic straight-line + avg speed)
router.get('/routes/:routeId/eta', auth, checkVerification, async (req, res) => {
  try {
    const { routeId } = req.params;
    const avgSpeedKmph = Number(process.env.BUS_AVG_SPEED_KMPH || 25);
    const route = await Transport.findById(routeId);
    if (!route || !route.lastLocation) return res.json({ eta: [] });

    const { latitude: curLat, longitude: curLng } = route.lastLocation;
    const toRad = (d) => d * Math.PI / 180;
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };

    const eta = route.stops.map(stop => {
      if (!stop.coordinates?.latitude || !stop.coordinates?.longitude) return { stop: stop.name, etaMinutes: null };
      const km = haversineKm(curLat, curLng, stop.coordinates.latitude, stop.coordinates.longitude);
      const minutes = Math.round((km / avgSpeedKmph) * 60);
      return { stop: stop.name, etaMinutes: minutes };
    });

    res.json({ routeId, eta });
  } catch (error) {
    console.error('ETA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all routes
router.get('/routes', auth, checkVerification, async (req, res) => {
  try {
    const routes = await Transport.find({ status: 'active' })
      .populate('createdBy', 'firstName lastName')
      .sort({ routeNumber: 1 });

    // For students, add subscription status
    if (req.user.role === 'student') {
      const routesWithStatus = routes.map(route => {
        const subscription = route.subscribers.find(
          sub => sub.student.toString() === req.user._id.toString()
        );
        return {
          ...route.toObject(),
          isSubscribed: !!subscription,
          subscriptionStatus: subscription?.status,
          subscribedStop: subscription?.stop,
          monthlyFee: subscription?.monthlyFee
        };
      });
      return res.json({ routes: routesWithStatus });
    }

    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transport route (Admin only)
router.post('/routes', auth, authorize('admin'), [
  body('routeNumber').trim().notEmpty().withMessage('Route number is required'),
  body('routeName').trim().notEmpty().withMessage('Route name is required'),
  body('driver.name').trim().notEmpty().withMessage('Driver name is required'),
  body('driver.phone').trim().notEmpty().withMessage('Driver phone is required'),
  body('vehicle.number').trim().notEmpty().withMessage('Vehicle number is required'),
  body('vehicle.capacity').isInt({ min: 1 }).withMessage('Vehicle capacity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      routeNumber, routeName, driver, vehicle, stops, schedule
    } = req.body;

    // Check if route number already exists
    const existingRoute = await Transport.findOne({ routeNumber });
    if (existingRoute) {
      return res.status(400).json({ message: 'Route number already exists' });
    }

    const transport = new Transport({
      routeNumber,
      routeName,
      driver,
      vehicle,
      stops: stops || [],
      schedule,
      createdBy: req.user._id
    });

    await transport.save();
    await transport.populate('createdBy', 'firstName lastName');

    res.status(201).json({ message: 'Transport route created successfully', transport });
  } catch (error) {
    console.error('Create transport route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Subscribe to route (Student)
router.post('/routes/:routeId/subscribe', auth, authorize('student'), checkVerification, [
  body('stop').trim().notEmpty().withMessage('Stop is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { routeId } = req.params;
    const { stop } = req.body;

    const route = await Transport.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.status !== 'active') {
      return res.status(400).json({ message: 'Route is not active' });
    }

    // Check if already subscribed
    const existingSubscription = route.subscribers.find(
      sub => sub.student.toString() === req.user._id.toString()
    );

    if (existingSubscription) {
      return res.status(400).json({ message: 'Already subscribed to this route' });
    }

    // Validate stop
    const validStop = route.stops.find(s => s.name === stop);
    if (!validStop) {
      return res.status(400).json({ message: 'Invalid stop' });
    }

    route.subscribers.push({
      student: req.user._id,
      stop,
      monthlyFee: validStop.fare * 30 // Assuming monthly subscription
    });

    await route.save();

    res.json({ message: 'Subscribed to route successfully' });
  } catch (error) {
    console.error('Subscribe to route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get route subscribers (Admin only)
router.get('/routes/:routeId/subscribers', auth, authorize('admin'), async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Transport.findById(routeId)
      .populate('subscribers.student', 'firstName lastName studentId department');

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json({ 
      route: {
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        capacity: route.vehicle.capacity
      },
      subscribers: route.subscribers 
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;