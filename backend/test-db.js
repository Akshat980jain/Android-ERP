// test-db.js - Run this file to test your MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
  process.exit(1);
}

// Test the connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Atlas connection successful!');
  console.log('Connected to:', mongoose.connection.name);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:');
  console.error('Error:', error.message);
  
  // Common error checks
  if (error.message.includes('authentication')) {
    console.log('💡 Check your username and password in the connection string');
  }
  if (error.message.includes('network')) {
    console.log('💡 Check your internet connection and MongoDB Atlas network settings');
  }
  if (error.message.includes('timeout')) {
    console.log('💡 Check if your IP is whitelisted in MongoDB Atlas');
  }
  
  process.exit(1);
});