const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  try {
    // Wait for email service to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📧 Email Service Status:', {
      configured: emailService.isConfigured,
      environment: process.env.NODE_ENV || 'development'
    });

    if (!emailService.isConfigured) {
      console.log('❌ Email service is not configured properly');
      return;
    }

    console.log('✅ Email service is configured\n');

    // Test sending a test email
    console.log('📤 Sending test email...');
    const testResult = await emailService.testEmailService();
    
    if (testResult.success) {
      console.log('✅ Test email sent successfully!');
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Check the console for Ethereal Email preview URL');
      }
    } else {
      console.log('❌ Test email failed:', testResult.message);
    }

    console.log('\n📋 Test Results:', testResult);

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

// Run the test
testEmailService().then(() => {
  console.log('\n🏁 Email service test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

