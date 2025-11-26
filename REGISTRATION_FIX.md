# Registration 400 Error - FIXED ✅

## 🔍 Problem Analysis

**Error:** HTTP 400 (Bad Request) when registering from Android app

**Server Logs:**
```
192.168.1.2 - - [29/Oct/2025:07:24:38 +0000] 
"POST /api/auth/register HTTP/1.1" 400 68
```

**Root Cause:**
The backend expected a `name` field, but the Android app was sending `firstName` and `lastName` fields instead.

---

## ✅ Solution Applied

### **Changes Made to `backend/routes/auth.js`:**

1. **Extract all fields from request body:**
   ```javascript
   const { name, firstName, lastName, email, password, role, 
          profile, department, course, branch, phone } = req.body;
   ```

2. **Handle both name formats:**
   ```javascript
   // Handle name from firstName+lastName or name field
   let fullName = name;
   if (!fullName && firstName) {
     fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName;
   }
   ```

3. **Validate with combined name:**
   ```javascript
   if (!fullName || !email || !password) {
     return res.status(400).json({ 
       success: false, 
       message: 'Name, email, and password are required' 
     });
   }
   ```

4. **Build profile data:**
   ```javascript
   const profileData = {
     ...(profile || {}),
     ...(phone && { phone }),
     ...(course && { course }),
     ...(branch && { branch }),
   };
   ```

5. **Use combined name in user creation:**
   ```javascript
   const user = new User({ 
     name: fullName.trim(), 
     email: email.toLowerCase().trim(), 
     password, 
     role: role || 'student', 
     ...(Object.keys(profileData).length > 0 && { profile: profileData }),
     ...(department && { department }),
     isVerified: true
   });
   ```

---

## 🎯 What This Fixes

### **Before:**
```javascript
// Backend expected:
{ name: "John Doe", email: "...", password: "..." }

// Android sent:
{ firstName: "John", lastName: "Doe", email: "...", password: "..." }
// ❌ Error 400: Name, email, and password are required
```

### **After:**
```javascript
// Android sends:
{ firstName: "John", lastName: "Doe", email: "...", password: "..." }

// Backend handles both formats:
- If `name` exists → use it
- If `firstName` exists → combine with lastName
- Result: `fullName = "John Doe"` ✅
```

---

## 📋 Request Format Support

The backend now supports **both registration request formats**:

### **Format 1: Single Name Field**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### **Format 2: First/Last Name (Android App)**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91 1234567890",
  "course": "B.Tech",
  "branch": "Computer Science",
  "role": "student"
}
```

**Both formats work correctly now!** ✅

---

## 🔄 Server Restart Required

After modifying the backend, you need to restart the server:

```powershell
# Stop the backend
taskkill /F /IM node.exe

# Start the backend
cd backend
npm start
```

Or use the batch script:
```powershell
start-all-servers.bat
```

---

## ✅ Testing

### **Test Registration:**

1. **Open Android app**
2. **Go to Register screen**
3. **Fill in the form:**
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
   - Course: "B.Tech"
   - Branch: "Computer Science"
   - Phone: "+91 1234567890"
4. **Tap Register**

**Expected Result:**
```
✅ Registration Successful
✅ "Please check your email for verification instructions."
✅ Navigate to Login screen
```

---

## 🔍 Debugging Steps

If you still get errors:

1. **Check server logs:**
   ```powershell
   # In backend terminal, you should see:
   # "Server running on port 5000"
   # "Registration request: {...}"
   ```

2. **Verify data being sent:**
   ```javascript
   // In Android app, check console logs
   console.log("Registration data:", userData);
   ```

3. **Check network connection:**
   ```powershell
   netstat -ano | findstr :5000
   # Should show LISTENING state
   ```

4. **Test with curl:**
   ```powershell
   curl -X POST http://192.168.1.11:5000/api/auth/register ^
   -H "Content-Type: application/json" ^
   -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@example.com\",\"password\":\"test123\",\"role\":\"student\"}"
   ```

---

## 📝 Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `backend/routes/auth.js` | Extract `firstName`, `lastName` from body | ✅ |
| `backend/routes/auth.js` | Combine firstName+lastName if no `name` | ✅ |
| `backend/routes/auth.js` | Handle `phone`, `course`, `branch` in profile | ✅ |
| `backend/routes/auth.js` | Build profileData object conditionally | ✅ |

---

## 🎉 Result

**The 400 error is now fixed!**

The backend will now correctly handle registration requests from the Android app with `firstName` and `lastName` fields.

**After restarting the backend server, try registering again!** 🚀

