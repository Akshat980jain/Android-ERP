# Network Troubleshooting Guide

## Common Issues and Solutions

### 1. "Network request failed" or "Aborted" Errors

This usually means the Android app cannot connect to the backend server.

#### Quick Fix:
1. Run the IP update script:
   ```bash
   cd android
   node scripts/update-ip.js
   ```

2. Make sure the backend server is running:
   ```bash
   cd ../backend
   npm start
   ```

#### Manual Fix:
1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `android/src/services/api.ts`:
   - Change `192.168.1.12` to your current IP address in both `API_BASE_URL` and `FALLBACK_URLS`

3. Update `android/network_security_config.xml`:
   - Add your IP address to the domain list

### 2. Backend Server Not Responding

Check if the backend is running:
```bash
# Check if port 5000 is listening
netstat -an | findstr :5000  # Windows
netstat -an | grep :5000     # Mac/Linux

# Test the API directly
curl http://YOUR_IP:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

### 3. IP Address Changes Frequently

If your IP address changes often (common with DHCP), you can:

1. **Use the automatic script** (recommended):
   ```bash
   node scripts/update-ip.js
   ```

2. **Set up a static IP** on your router/network

3. **Use localhost for emulator**:
   - For Android emulator, use `10.0.2.2:5000`
   - For iOS simulator, use `localhost:5000`

### 4. Security Configuration Issues

Make sure your `android/app.json` has:
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true,
      "networkSecurityConfig": "network_security_config.xml"
    }
  }
}
```

### 5. Testing Connectivity

Test if your setup works:
1. Start the backend server
2. Run the IP update script
3. Start the Android app
4. Try to login

### 6. Debug Information

The app logs detailed network information. Look for:
- "Attempt X: Making API request to:"
- "Response status:"
- "Network status check"

If you see "Aborted" errors, it's usually a network connectivity issue.

## Network Configuration Files

- `src/services/api.ts` - Main API configuration
- `network_security_config.xml` - Android network security
- `app.json` - Expo configuration
- `scripts/update-ip.js` - Automatic IP updater

## Need Help?

1. Check the console logs for detailed error messages
2. Verify your IP address with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Make sure both devices (computer and phone/emulator) are on the same network
4. Check firewall settings - port 5000 should be accessible

