require('dotenv').config();

console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'NOT SET');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');

// Test JWT signing
const jwt = require('jsonwebtoken');
try {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign({ id: 'test' }, secret, { expiresIn: '30d' });
  console.log('JWT signing test: SUCCESS');
  console.log('Token preview:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('JWT signing test: FAILED', error.message);
} 