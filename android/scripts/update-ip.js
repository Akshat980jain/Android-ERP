const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Auto-detect and update local IP in API configuration
 * Run this script whenever your IP changes: node scripts/update-ip.js
 */

function getLocalIP() {
  try {
    // Windows
    if (process.platform === 'win32') {
      const output = execSync('ipconfig', { encoding: 'utf-8' });
      const lines = output.split('\n');

      const validIPs = [];

      // Collect all valid IPv4 addresses
      for (const line of lines) {
        if (line.includes('IPv4 Address')) {
          const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (match && match[1] && !match[1].startsWith('127.') && !match[1].startsWith('169.254.')) {
            validIPs.push(match[1]);
          }
        }
      }

      // Prioritize 192.168.1.x (typical home WiFi) over 192.168.137.x (Windows hotspot)
      const preferredIP = validIPs.find(ip => ip.startsWith('192.168.1.'));
      if (preferredIP) return preferredIP;

      // Otherwise return the first valid IP
      if (validIPs.length > 0) return validIPs[0];
    }
    // macOS/Linux
    else {
      const output = execSync('ifconfig', { encoding: 'utf-8' });
      const lines = output.split('\n');

      for (const line of lines) {
        if (line.includes('inet ') && !line.includes('127.0.0.1')) {
          const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
          if (match && match[1] && !match[1].startsWith('169.254.')) {
            return match[1];
          }
        }
      }
    }
  } catch (error) {
    console.error('Error detecting IP:', error.message);
  }

  return null;
}

function updateConfigFile(newIP) {
  const configPath = path.join(__dirname, '../src/config/api.config.ts');

  if (!fs.existsSync(configPath)) {
    console.error('❌ Config file not found:', configPath);
    return false;
  }

  let content = fs.readFileSync(configPath, 'utf-8');

  // Extract current IP
  const currentIPMatch = content.match(/const LOCAL_IP = '(\d+\.\d+\.\d+\.\d+)'/);
  const currentIP = currentIPMatch ? currentIPMatch[1] : 'unknown';

  if (currentIP === newIP) {
    console.log('✅ IP address is already up to date:', newIP);
    return true;
  }

  // Replace the IP
  content = content.replace(
    /const LOCAL_IP = '\d+\.\d+\.\d+\.\d+'/,
    `const LOCAL_IP = '${newIP}'`
  );

  fs.writeFileSync(configPath, content, 'utf-8');

  console.log('✅ Updated IP address:');
  console.log('   Old IP:', currentIP);
  console.log('   New IP:', newIP);
  console.log('\n📱 Restart your app to apply changes');

  return true;
}

// Main execution
console.log('🔍 Detecting local IP address...\n');

const detectedIP = getLocalIP();

if (!detectedIP) {
  console.error('❌ Could not detect local IP address');
  console.log('\n💡 Manual update required:');
  console.log('   1. Run "ipconfig" (Windows) or "ifconfig" (Mac/Linux)');
  console.log('   2. Find your IPv4 address');
  console.log('   3. Update LOCAL_IP in: src/config/api.config.ts');
  process.exit(1);
}

console.log('🌐 Detected IP:', detectedIP);
console.log('');

updateConfigFile(detectedIP);
