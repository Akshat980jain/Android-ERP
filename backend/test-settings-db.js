/**
 * Test script to verify Settings are being saved to the database correctly
 * 
 * Usage:
 *   node test-settings-db.js
 * 
 * This script will:
 * 1. Connect to the database
 * 2. Check if Settings collection exists
 * 3. Display current settings
 * 4. Optionally create test settings
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import Settings model
const Settings = require('./models/Settings');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/educonnect';
    log.info(`Connecting to MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    
    log.success('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    return false;
  }
}

async function checkSettings() {
  try {
    log.title('📋 CHECKING SETTINGS IN DATABASE');
    
    // Count settings documents
    const count = await Settings.countDocuments();
    log.info(`Settings documents found: ${count}`);
    
    if (count === 0) {
      log.warning('No settings found in database');
      return null;
    }
    
    // Get the settings
    const settings = await Settings.findOne();
    
    if (!settings) {
      log.warning('Settings collection exists but no document found');
      return null;
    }
    
    log.success('Settings document found!');
    
    // Display settings
    log.title('🏢 INSTITUTION INFORMATION');
    console.log('  Name:    ', settings.institution.name);
    console.log('  Address: ', settings.institution.address);
    console.log('  Phone:   ', settings.institution.phone);
    console.log('  Email:   ', settings.institution.email);
    console.log('  Website: ', settings.institution.website);
    
    log.title('🎓 ACADEMIC SETTINGS');
    console.log('  Academic Year:      ', settings.academic.currentAcademicYear);
    console.log('  Semester:          ', settings.academic.currentSemester);
    console.log('  Grading System:    ', settings.academic.gradingSystem);
    console.log('  Pass Percentage:   ', settings.academic.passPercentage + '%');
    console.log('  Attendance Required:', settings.academic.maxAttendancePercentage + '%');
    
    log.title('🔒 SECURITY SETTINGS');
    console.log('  Password Min Length:', settings.security.passwordMinLength);
    console.log('  Max Login Attempts: ', settings.security.maxLoginAttempts);
    console.log('  Two-Factor Auth:   ', settings.security.twoFactorAuth ? 'Enabled' : 'Disabled');
    console.log('  Session Timeout:   ', settings.security.sessionTimeout + ' seconds');
    
    log.title('🔔 NOTIFICATION SETTINGS');
    console.log('  Email Notifications:', settings.notifications.emailNotifications ? 'Enabled' : 'Disabled');
    console.log('  SMS Notifications:  ', settings.notifications.smsNotifications ? 'Enabled' : 'Disabled');
    console.log('  Push Notifications: ', settings.notifications.pushNotifications ? 'Enabled' : 'Disabled');
    console.log('  Retention Days:     ', settings.notifications.notificationRetentionDays);
    
    log.title('⚙️  FEATURE FLAGS');
    console.log('  Chat:       ', settings.features.chatEnabled ? 'Enabled' : 'Disabled');
    console.log('  File Upload:', settings.features.fileUploadEnabled ? 'Enabled' : 'Disabled');
    console.log('  Analytics:  ', settings.features.analyticsEnabled ? 'Enabled' : 'Disabled');
    console.log('  Backup:     ', settings.features.backupEnabled ? 'Enabled' : 'Disabled');
    
    log.title('📅 METADATA');
    console.log('  Document ID:', settings._id);
    console.log('  Created At: ', settings.createdAt);
    console.log('  Updated At: ', settings.updatedAt);
    
    return settings;
  } catch (error) {
    log.error(`Error checking settings: ${error.message}`);
    return null;
  }
}

async function createTestSettings() {
  try {
    log.title('🔧 CREATING TEST SETTINGS');
    
    const testSettings = {
      institution: {
        name: 'Test University',
        address: '456 Test Street, Test City',
        phone: '+1-555-TEST',
        email: 'test@university.edu',
        website: 'www.testuniversity.edu'
      },
      academic: {
        currentAcademicYear: '2024',
        currentSemester: '2nd',
        gradingSystem: 'percentage',
        passPercentage: 50,
        maxAttendancePercentage: 80
      },
      security: {
        passwordMinLength: 10,
        maxLoginAttempts: 3,
        twoFactorAuth: true,
        sessionTimeout: 7200
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        notificationRetentionDays: 60
      },
      features: {
        chatEnabled: true,
        fileUploadEnabled: true,
        analyticsEnabled: true,
        backupEnabled: true
      }
    };
    
    // Delete existing settings
    await Settings.deleteMany({});
    log.info('Deleted existing settings');
    
    // Create new test settings
    const newSettings = await Settings.create(testSettings);
    log.success('Test settings created successfully!');
    
    return newSettings;
  } catch (error) {
    log.error(`Error creating test settings: ${error.message}`);
    return null;
  }
}

async function updateTestSettings() {
  try {
    log.title('🔄 UPDATING SETTINGS');
    
    const updateData = {
      institution: {
        name: 'Updated University Name',
        address: '789 Updated Street, Updated City',
        phone: '+1-555-UPDATE',
        email: 'updated@university.edu',
        website: 'www.updateduniversity.edu'
      }
    };
    
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true }
    );
    
    if (updatedSettings) {
      log.success('Settings updated successfully!');
      log.info(`New institution name: ${updatedSettings.institution.name}`);
      return updatedSettings;
    } else {
      log.warning('No settings found to update');
      return null;
    }
  } catch (error) {
    log.error(`Error updating settings: ${error.message}`);
    return null;
  }
}

async function main() {
  log.title('🧪 SETTINGS DATABASE TEST');
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  // Check current settings
  let settings = await checkSettings();
  
  // Prompt user for action
  console.log('\n');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('What would you like to do?\n  1. View current settings (default)\n  2. Create test settings\n  3. Update settings\n  4. Exit\nChoice (1-4): ', async (answer) => {
    readline.close();
    
    switch (answer.trim()) {
      case '2':
        await createTestSettings();
        await checkSettings();
        break;
      case '3':
        await updateTestSettings();
        await checkSettings();
        break;
      case '4':
        log.info('Exiting...');
        break;
      default:
        // Already displayed settings above
        log.info('Current settings displayed above');
    }
    
    // Close database connection
    await mongoose.connection.close();
    log.success('Database connection closed');
    process.exit(0);
  });
}

// Run the script
main().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

