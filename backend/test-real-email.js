require('dotenv').config();
const emailService = require('./services/emailService');

async function testRealEmail() {
  console.log('🧪 Testing Real Email Configuration...\n');

  // Set environment to production
  process.env.NODE_ENV = 'production';
  
  // Check if .env file is loaded
  console.log('📁 Environment Variables Check:');
  console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('- EMAIL_USER:', process.env.EMAIL_USER);
  console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('- TEST_EMAIL:', process.env.TEST_EMAIL);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('');
  
  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Missing required environment variables!');
    console.log('Please check your .env file contains:');
    console.log('- EMAIL_USER=your-email@gmail.com');
    console.log('- EMAIL_PASSWORD=your-app-password');
    console.log('- EMAIL_FROM=EduConnect <your-email@gmail.com>');
    console.log('- TEST_EMAIL=your-email@gmail.com');
    return;
  }

  try {
    // Wait for email service to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📧 Email Configuration:');
    console.log('- Service:', process.env.EMAIL_SERVICE);
    console.log('- User:', process.env.EMAIL_USER);
    console.log('- From:', process.env.EMAIL_FROM);
    console.log('- Environment:', process.env.NODE_ENV);
    console.log('- Configured:', emailService.isConfigured);

    if (!emailService.isConfigured) {
      console.log('\n❌ Email service is not configured properly');
      console.log('Please check your .env file and email credentials');
      return;
    }

    console.log('\n✅ Email service is configured\n');

    // Test sending a real email
    console.log('📤 Sending test email...');
    const testResult = await emailService.sendEmail(
      process.env.TEST_EMAIL || process.env.EMAIL_USER,
      'Test Email from EduConnect',
      'test',
      {
        name: 'Test User',
        timestamp: new Date().toISOString()
      }
    );
    
    if (testResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Check your email inbox for the test message');
    } else {
      console.log('❌ Test email failed:', testResult.message);
      console.log('Error details:', testResult.error);
    }

    console.log('\n📋 Test Results:', testResult);

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

// Run the test
testRealEmail().then(() => {
  console.log('\n🏁 Email service test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
