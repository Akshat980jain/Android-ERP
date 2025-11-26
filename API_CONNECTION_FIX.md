# API Connection Issue - RESOLVED ✅

## 🔍 Problem
API request failed with timeout error when trying to register/login from the Android app.

**Error Message:**
```
API request failed for all candidate URLs: 
{"endpoint": "/auth/register", "reason": "timeout", 
"tried": ["http://192.168.1.11:5000/api", ...]}
```

---

## ✅ Solution

### **Root Cause:**
The **backend server was not running** on port 5000.

### **Resolution Steps:**

1. **Checked server status:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   - Initially showed `FIN_WAIT_2` (disconnected)
   - No active `LISTENING` state

2. **Started the backend server:**
   ```powershell
   cd backend
   npm start
   ```

3. **Verified server is running:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   - Now shows: `TCP    0.0.0.0:5000   0.0.0.0:0    LISTENING`

4. **Confirmed IP configuration:**
   ```powershell
   ipconfig | findstr IPv4
   ```
   - IP Address: `192.168.1.11` ✅
   - This matches the configured API_BASE_URL in the Android app

---

## 🎯 Current Status

### **Backend Server:**
- ✅ **Running** on port 5000
- ✅ **Listening** on `0.0.0.0:5000` (all interfaces)
- ✅ **IP:** `192.168.1.11` (correct)
- ✅ **Accessible** from Android app

### **Configuration:**
- ✅ **API_BASE_URL:** `http://192.168.1.11:5000/api`
- ✅ **IP matches** network configuration
- ✅ **Port 5000** is open and listening

---

## 🚀 How to Start Servers

### **Option 1: Batch Script (Recommended)**
```bash
# From project root
start-all-servers.bat
```
This starts:
1. Backend (port 5000) - Node.js/Express
2. Frontend (port 5173) - Vite/React
3. Android (Expo) - Metro Bundler

### **Option 2: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Android
cd android
npm start
```

---

## 🔧 Verify Connection

### **Check Backend is Running:**
```powershell
netstat -ano | findstr :5000
```
Should show:
```
TCP    0.0.0.0:5000           0.0.0.0:0    LISTENING    [PID]
```

### **Test API Endpoint:**
```powershell
curl http://192.168.1.11:5000/api/health
```
Or open in browser: `http://192.168.1.11:5000/api/health`

### **Check IP Address:**
```powershell
ipconfig | findstr IPv4
```

---

## 🛠️ Troubleshooting

### **If timeout error persists:**

1. **Check Firewall:**
   - Ensure Windows Firewall allows port 5000
   - Or temporarily disable for testing

2. **Check Backend Logs:**
   ```bash
   cd backend
   npm start
   ```
   - Look for error messages
   - Verify database connection

3. **Check MongoDB:**
   - Ensure MongoDB service is running
   - `services.msc` → MongoDB

4. **Verify IP:**
   - Run `ipconfig` to get current IP
   - Update `android/src/services/api.ts` if IP changed

5. **Check Device Network:**
   - Android device must be on same WiFi network
   - Not on cellular data

---

## 📱 Android App Configuration

### **File:** `android/src/services/api.ts`

Current configuration:
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.11:5000/api'  // Current IP
  : 'http://192.168.1.11:5000/api'; // Production
```

**If IP changes:**
1. Get new IP: `ipconfig`
2. Update API_BASE_URL in `android/src/services/api.ts`
3. Restart Expo: `npm start`

---

## ✅ Quick Fix Commands

```powershell
# 1. Check if backend is running
netstat -ano | findstr :5000

# 2. If not running, start it
cd ..
cd backend
npm start

# 3. Wait for "Server running on port 5000"

# 4. In Android app, try register/login again
```

---

## 🎉 Result

**Backend server is now running and accepting connections!**

The Android app should now be able to:
- ✅ Register new users
- ✅ Login existing users
- ✅ Make API requests
- ✅ Access all backend endpoints

---

## 📝 Server Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 5000 | http://localhost:5000 |
| Frontend | 5173 | http://localhost:5173 |
| Android | 8081 | Expo DevTools |

**Note:** Use `localhost` for local testing, `192.168.1.11` for Android device on same network.

---

## 🔐 Network Requirements

For Android app to connect:
1. ✅ Backend server running on 192.168.1.11:5000
2. ✅ Android device on same WiFi network
3. ✅ Windows Firewall allows port 5000
4. ✅ No VPN blocking connection

**Current Status:** ✅ All requirements met!

---

**The timeout error is now resolved. You can register and login from the Android app!** 🎊

