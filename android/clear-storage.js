#!/usr/bin/env node

/**
 * Script to clear AsyncStorage on the device
 * This will force the user to login again with fresh credentials
 */

console.log('🧹 To clear the app storage on your device:');
console.log('');
console.log('Method 1: Uninstall and reinstall the app from Expo Go');
console.log('  - Close the app completely');
console.log('  - In Expo Go, long-press on your project');
console.log('  - Select "Clear data" or "Remove"');
console.log('  - Scan the QR code again');
console.log('');
console.log('Method 2: Shake the device to open the developer menu');
console.log('  - Shake your phone to open the dev menu');
console.log('  - Tap "Reload" to restart with cleared state');
console.log('');
console.log('Method 3: Stop and restart the Expo server');
console.log('  - Press Ctrl+C to stop the server');
console.log('  - Run: npm start -- --clear');
console.log('  - Scan the QR code again');
console.log('');
console.log('✅ The app now automatically clears invalid tokens!');
console.log('📱 Just reload the app and login with valid credentials.');

