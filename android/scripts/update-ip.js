#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the current local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) addresses and IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer Wi-Fi or Ethernet interfaces
        if (name.toLowerCase().includes('wifi') || name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('lan')) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback to first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

// Update API service file
function updateApiService(newIP) {
  const apiServicePath = path.join(__dirname, '..', 'src', 'services', 'api.ts');
  
  if (!fs.existsSync(apiServicePath)) {
    console.error('API service file not found:', apiServicePath);
    return false;
  }
  
  let content = fs.readFileSync(apiServicePath, 'utf8');
  
  // Replace IP addresses in API_BASE_URL
  content = content.replace(
    /const API_BASE_URL = __DEV__\s*\?\s*'http:\/\/[^']+'\s*:\s*'http:\/\/[^']+';/,
    `const API_BASE_URL = __DEV__ \n  ? 'http://${newIP}:5000/api'  // Development - use current computer IP\n  : 'http://${newIP}:5000/api'; // Production - same for now`
  );
  
  // Update FALLBACK_URLS
  const fallbackUrlsRegex = /const FALLBACK_URLS = \[([\s\S]*?)\];/;
  const match = content.match(fallbackUrlsRegex);
  
  if (match) {
    const newFallbackUrls = `const FALLBACK_URLS = [
  'http://${newIP}:5000/api',  // Current computer IP
  'http://10.0.2.2:5000/api',  // Android emulator localhost
  'http://localhost:5000/api',  // Localhost
  'http://192.168.137.1:5000/api' // Previous IP (fallback)
];`;
    
    content = content.replace(fallbackUrlsRegex, newFallbackUrls);
  }
  
  fs.writeFileSync(apiServicePath, content);
  console.log('✅ Updated API service with new IP:', newIP);
  return true;
}

// Update network security config
function updateNetworkSecurityConfig(newIP) {
  const configPath = path.join(__dirname, '..', 'network_security_config.xml');
  
  if (!fs.existsSync(configPath)) {
    console.error('Network security config file not found:', configPath);
    return false;
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  // Add new IP to domain config if not already present
  const domainRegex = /<domain includeSubdomains="true">192\.168\.1\.\d+<\/domain>/;
  if (!content.includes(`<domain includeSubdomains="true">${newIP}</domain>`)) {
    // Insert new IP as first domain
    content = content.replace(
      /<domain-config cleartextTrafficPermitted="true">/,
      `<domain-config cleartextTrafficPermitted="true">\n        <domain includeSubdomains="true">${newIP}</domain>`
    );
    console.log('✅ Updated network security config with new IP:', newIP);
  } else {
    console.log('✅ IP already exists in network security config:', newIP);
  }
  
  fs.writeFileSync(configPath, content);
  return true;
}

// Main function
function main() {
  console.log('🔍 Detecting local IP address...');
  
  const newIP = getLocalIP();
  
  if (!newIP) {
    console.error('❌ Could not detect local IP address');
    process.exit(1);
  }
  
  console.log('📍 Detected IP address:', newIP);
  
  // Update files
  const apiUpdated = updateApiService(newIP);
  const configUpdated = updateNetworkSecurityConfig(newIP);
  
  if (apiUpdated && configUpdated) {
    console.log('🎉 Successfully updated Android app configuration!');
    console.log('📱 You can now run the Android app and it should connect to the backend.');
    console.log('🔧 Make sure your backend server is running on port 5000');
  } else {
    console.error('❌ Failed to update some configuration files');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getLocalIP, updateApiService, updateNetworkSecurityConfig };

