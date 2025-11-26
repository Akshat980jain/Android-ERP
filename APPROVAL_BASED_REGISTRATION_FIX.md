# Approval-Based Registration System ✅

## 🔍 Problem

Users could register directly and login immediately without admin approval.

---

## ✅ Solution Implemented

**All registrations now require admin approval before users can login.**

---

## 🔄 Registration Flow Changes

### **Before:**
```
User Registers → User Created Immediately → User Can Login
❌ No approval required
```

### **After:**
```
User Registers → Verification Request Created → Admin Approves → User Created → User Can Login
✅ Approval required
```

---

## 📋 Changes Made

### **1. Backend: Changed `/register` Endpoint**

**File:** `backend/routes/auth.js`

**Before:**
- Created User directly
- Set `isVerified: true`
- Returned token immediately

**After:**
- Creates `RoleRequest` instead of `User`
- Sets `status: 'pending'`
- Returns message: "Registration request submitted. Please wait for admin approval."

**Key Changes:**
```javascript
// Old: Created user directly
const user = new User({ ... });
await user.save();
const token = generateToken(user._id);
res.json({ success: true, token, user });

// New: Creates verification request
const roleRequest = new RoleRequest({
  name: fullName.trim(),
  email: email.toLowerCase().trim(),
  password: password,
  requestedRole: requestedRole,
  program: requestProgram,
  branch: branch,
  status: 'pending',
  ...
});
await roleRequest.save();
res.json({ 
  success: true, 
  message: 'Registration request submitted. Please wait for admin approval.',
  requestId: roleRequest._id
});
```

---

### **2. Request Filtering Logic**

**File:** `backend/routes/auth.js` - `/verification-requests` endpoint

**Head Admin** sees:
- ✅ All `admin` role requests (head admin, branch admin)
- ✅ All `library` role requests
- ✅ All `placement` role requests
- ✅ Student/faculty requests **without** specific program

**Branch Admin** sees:
- ✅ Student requests for **their program only**
- ✅ Faculty requests for **their program only**
- ❌ Does NOT see admin requests
- ❌ Does NOT see library/placement requests

**Code:**
```javascript
if (isProgramAdmin) {
  // Branch Admins see student and faculty requests for their programs ONLY
  query.$and = [
    { requestedRole: { $in: ['student', 'faculty'] } },
    { program: { $in: adminPrograms } }
  ];
} else if (isSuperAdmin) {
  // Head Admins see admin, library, placement requests
  query.$or = [
    { requestedRole: { $in: ['admin', 'library', 'placement'] } },
    { requestedRole: { $in: ['student', 'faculty'] }, program: null }
  ];
}
```

---

### **3. Login Already Blocks Unverified Users**

**File:** `backend/routes/auth.js` - `/login` endpoint

**Existing check:**
```javascript
// Check if user is verified
if (!user.isVerified) {
  return res.status(400).json({ 
    success: false,
    message: 'Account not verified. Please contact administrator.' 
  });
}
```

**Result:** ✅ Unverified users **cannot login**

---

### **4. Android: Updated Registration Message**

**File:** `android/src/screens/auth/RegisterScreen.tsx`

**Before:**
```
"Registration Successful"
"Please check your email for verification instructions."
```

**After:**
```
"Registration Request Submitted"
"Your registration request has been submitted. Please wait for admin approval before you can login."
```

---

### **5. RoleRequest Schema Updated**

**File:** `backend/models/RoleRequest.js`

**Added fields:**
- `phone` - For storing phone number
- `course` - For storing course name

---

## 🎯 Request Routing

### **Example Scenarios:**

#### **Scenario 1: Student Registers for B.Tech**
```
1. Student registers with program: "B.Tech"
2. RoleRequest created: { requestedRole: 'student', program: 'B.Tech', status: 'pending' }
3. Request visible to: Branch Admin with adminPrograms: ['B.Tech']
4. Branch Admin approves → User created with isVerified: true
5. Student can now login
```

#### **Scenario 2: Faculty Registers for MBA**
```
1. Faculty registers with program: "MBA"
2. RoleRequest created: { requestedRole: 'faculty', program: 'MBA', status: 'pending' }
3. Request visible to: Branch Admin with adminPrograms: ['MBA']
4. Branch Admin approves → User created
5. Faculty can now login
```

#### **Scenario 3: Head Admin Registers**
```
1. User registers as admin, program: "Head Admin (No specific program)"
2. RoleRequest created: { requestedRole: 'admin', program: undefined, status: 'pending' }
3. Request visible to: Head Admin (adminPrograms: [])
4. Head Admin approves → User created with adminPrograms: []
5. New Head Admin can login
```

#### **Scenario 4: Branch Admin Registers for B.Tech**
```
1. User registers as admin, program: "B.Tech"
2. RoleRequest created: { requestedRole: 'admin', program: 'B.Tech', status: 'pending' }
3. Request visible to: Head Admin ONLY (not branch admins)
4. Head Admin approves → User created with adminPrograms: ['B.Tech']
5. New Branch Admin can login
```

---

## 📊 Request Visibility Matrix

| Request Type | Head Admin | Branch Admin |
|--------------|------------|--------------|
| **Head Admin Request** | ✅ | ❌ |
| **Branch Admin Request** | ✅ | ❌ |
| **Library Request** | ✅ | ❌ |
| **Placement Request** | ✅ | ❌ |
| **Student Request (B.Tech)** | ❌* | ✅ (if adminPrograms: ['B.Tech']) |
| **Faculty Request (B.Tech)** | ❌* | ✅ (if adminPrograms: ['B.Tech']) |
| **Student Request (No Program)** | ✅ | ❌ |

*Head Admin only sees student/faculty requests without programs

---

## 🔐 Security Features

### **Duplicate Prevention:**
```javascript
// Check if user already exists
const existingUser = await User.findOne({ email: email.toLowerCase() });
if (existingUser) {
  return res.status(400).json({ message: 'User already exists' });
}

// Check if request already pending
const existingRequest = await RoleRequest.findOne({ 
  email: email.toLowerCase(), 
  status: 'pending' 
});
if (existingRequest) {
  return res.status(400).json({ 
    message: 'Registration request already submitted. Please wait for admin approval.' 
  });
}
```

### **Login Protection:**
```javascript
if (!user.isVerified) {
  return res.status(400).json({ 
    message: 'Account not verified. Please contact administrator.' 
  });
}
```

---

## 🎨 User Experience Flow

### **Registration:**
1. User fills registration form
2. Clicks "Register"
3. Sees message: "Registration request submitted. Please wait for admin approval."
4. User cannot login yet

### **Admin Approval:**
1. Admin sees request in "Approve Requests" page
2. Admin reviews details
3. Admin clicks "Approve"
4. User account is created with `isVerified: true`
5. User can now login

### **Login Attempt (Before Approval):**
1. User tries to login
2. System checks `isVerified: false`
3. Shows error: "Account not verified. Please contact administrator."
4. User cannot access dashboard

---

## 📝 Testing Checklist

### **Test Registration:**
- [ ] Register as student → See "wait for approval" message
- [ ] Register as faculty → See "wait for approval" message
- [ ] Register as branch admin → See "wait for approval" message
- [ ] Register as head admin → See "wait for approval" message
- [ ] Try to login before approval → Blocked

### **Test Request Visibility:**
- [ ] Head admin sees admin requests → ✅
- [ ] Head admin sees library/placement requests → ✅
- [ ] Head admin sees student requests (no program) → ✅
- [ ] Branch admin sees student requests (their program) → ✅
- [ ] Branch admin sees faculty requests (their program) → ✅
- [ ] Branch admin does NOT see admin requests → ✅

### **Test Approval:**
- [ ] Admin approves student request → User created → User can login
- [ ] Admin approves faculty request → User created → User can login
- [ ] Admin approves admin request → User created → User can login
- [ ] Admin rejects request → No user created → Request marked rejected

---

## 🎉 Summary

**Changes Made:**
1. ✅ `/register` now creates `RoleRequest` instead of `User`
2. ✅ Request filtering routes to correct admin type
3. ✅ Login blocks unverified users (already existed)
4. ✅ Android shows appropriate approval message
5. ✅ RoleRequest schema updated with phone/course fields

**Result:**
- ✅ All registrations require admin approval
- ✅ Head admin sees admin/library/placement requests
- ✅ Branch admin sees student/faculty requests for their program
- ✅ Users cannot login until approved
- ✅ Secure and proper request routing

**Security:** ✅ No direct user creation. All users must be verified by admin!


