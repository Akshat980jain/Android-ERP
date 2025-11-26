# 🚀 ERP System - Quick Start Guide

This guide will help you start all servers (Backend, Frontend, and Android) with a single click!

---

## 📋 Available Scripts

### 1. **start-all-servers.bat** (First Time Setup)
- ✅ Installs all dependencies (npm install)
- ✅ Starts all three servers
- ⏱️ Takes longer (5-10 minutes first time)
- 📦 Use this for **first-time setup** or after pulling new changes

**How to use:**
```bash
Double-click: start-all-servers.bat
```

---

### 2. **start-servers-quick.bat** (Quick Start)
- ⚡ Skips dependency installation
- ✅ Starts all three servers immediately
- ⏱️ Takes ~10 seconds
- 🎯 Use this for **daily development**

**How to use:**
```bash
Double-click: start-servers-quick.bat
```

---

### 3. **stop-all-servers.bat** (Stop All)
- 🛑 Stops all running Node.js servers
- 🧹 Cleans up processes
- 💡 Use when you're done working or need to restart

**How to use:**
```bash
Double-click: stop-all-servers.bat
```

---

## 🖥️ What Happens When You Start?

The script will open **3 separate terminal windows**:

### Window 1: Backend Server
- **Directory:** `backend/`
- **Port:** 5000
- **URL:** http://localhost:5000
- **API:** http://localhost:5000/api

### Window 2: Frontend Server (Vite)
- **Directory:** `frontend/`
- **Port:** 5173
- **URL:** http://localhost:5173
- **Framework:** React + Vite

### Window 3: Android/Expo Server
- **Directory:** `android/`
- **Port:** 8081 (Metro Bundler)
- **Framework:** React Native + Expo
- **Access:** Scan QR code with Expo Go app

---

## ⚙️ Before First Run

Make sure you have these installed:

1. **Node.js** (v16 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **MongoDB** (running locally or cloud)
   - Local: Make sure MongoDB service is running
   - Cloud: Update `.env` in backend folder

3. **Git** (optional, for version control)
   - Check: `git --version`

---

## 🔧 Environment Setup

### Backend (.env file)
Create `backend/.env` with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/erp
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Frontend (automatic)
Frontend will automatically connect to `http://localhost:5000`

### Android (automatic)
Android will automatically detect your network IP

---

## 📱 Testing the Android App

1. Install **Expo Go** on your phone:
   - Android: Google Play Store
   - iOS: App Store

2. Make sure your phone and computer are on the **same WiFi**

3. Open Expo Go and scan the QR code from the terminal

---

## ❓ Troubleshooting

### Problem: "Port already in use"
**Solution:** Run `stop-all-servers.bat` first, then start again

### Problem: "Cannot find module"
**Solution:** Run `start-all-servers.bat` (with npm install)

### Problem: "MongoDB connection failed"
**Solution:** 
- Check if MongoDB is running
- Verify `MONGODB_URI` in backend/.env

### Problem: "Android won't connect to backend"
**Solution:**
1. Run `cd android && npm run update-ip`
2. Make sure phone and PC are on same WiFi
3. Check Windows Firewall settings

---

## 🎯 Recommended Workflow

### Daily Development:
1. Start: `start-servers-quick.bat`
2. Work on your code
3. Stop: `stop-all-servers.bat` or close terminal windows

### After Git Pull / New Dependencies:
1. Start: `start-all-servers.bat`
2. Wait for installations to complete
3. Continue development

### Clean Restart:
1. Run: `stop-all-servers.bat`
2. Wait 5 seconds
3. Run: `start-servers-quick.bat`

---

## 📊 Server Status Check

### Check Backend:
```bash
curl http://localhost:5000/api/health
```

### Check Frontend:
Open browser: http://localhost:5173

### Check Android:
Terminal should show "Expo DevTools running at..." with QR code

---

## 🛠️ Manual Start (If Needed)

If you prefer to start servers individually:

```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev

# Android (new terminal)
cd android
npm start
```

---

## 📝 Notes

- **Terminal windows will stay open** - Don't close them while working
- **Servers restart automatically** when you save code changes (hot reload)
- **First startup** takes longer due to dependency installation
- **Logs appear** in each respective terminal window

---

## 🎉 Quick Reference

| Script | When to Use | Speed |
|--------|-------------|-------|
| `start-all-servers.bat` | First time / After updates | Slow (5-10 min) |
| `start-servers-quick.bat` | Daily development | Fast (10 sec) |
| `stop-all-servers.bat` | End of day / Restart | Instant |

---

**Happy Coding! 🚀**

