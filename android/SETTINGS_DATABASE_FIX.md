# Settings Database Persistence Fix

## Problem
When users changed settings in the Admin Dashboard Settings section (institution information, academic settings, security settings, etc.), the changes were not being saved to the database. The backend was only returning success messages without actually persisting the data.

## Root Cause
1. **Backend Model**: The `Settings` model only had the `attendancePolicy` field defined
2. **Backend Route**: The PUT `/settings/system` endpoint was not saving settings to the database - it was just returning the data without persisting it
3. **No Database Persistence**: Only the `attendancePolicy` was being saved; all other settings (institution, academic, security, notifications, features) were being ignored

## Solution

### 1. Updated Settings Model (`backend/models/Settings.js`)

Expanded the Settings schema to include all system settings:

```javascript
const settingsSchema = new mongoose.Schema({
  // Institution Information
  institution: {
    name: { type: String, default: 'EduConnect University' },
    address: { type: String, default: '123 Education Street, Learning City' },
    phone: { type: String, default: '+1-555-0123' },
    email: { type: String, default: 'info@educonnect.edu' },
    website: { type: String, default: 'www.educonnect.edu' },
    logo: { type: String, default: '/uploads/logo.png' }
  },
  
  // Academic Settings
  academic: {
    currentAcademicYear: { type: String, default: () => new Date().getFullYear().toString() },
    currentSemester: { type: String, default: '1st' },
    gradingSystem: { type: String, default: 'percentage' },
    passPercentage: { type: Number, default: 40 },
    maxAttendancePercentage: { type: Number, default: 75 },
    assignmentSubmissionDeadline: { type: Number, default: 24 },
    examDuration: { type: Number, default: 180 }
  },
  
  // Notification Settings
  notifications: {
    emailNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: false },
    notificationRetentionDays: { type: Number, default: 30 }
  },
  
  // Security Settings
  security: {
    passwordMinLength: { type: Number, default: 8 },
    passwordComplexity: { type: String, default: 'medium' },
    sessionTimeout: { type: Number, default: 3600 },
    maxLoginAttempts: { type: Number, default: 5 },
    twoFactorAuth: { type: Boolean, default: false }
  },
  
  // Feature Flags
  features: {
    chatEnabled: { type: Boolean, default: false },
    fileUploadEnabled: { type: Boolean, default: false },
    analyticsEnabled: { type: Boolean, default: false },
    backupEnabled: { type: Boolean, default: false }
  },
  
  // Attendance Policy
  attendancePolicy: { type: attendancePolicySchema, default: () => ({}) },
}, { timestamps: true });
```

### 2. Updated GET Endpoint (`backend/routes/settings.js`)

The GET `/settings/system` endpoint now:
- Fetches settings from the database using `Settings.findOne()`
- Creates default settings if none exist (using `Settings.create()`)
- Returns settings with a `success: true` flag

```javascript
router.get('/system', auth, authorize('admin'), async (req, res) => {
  try {
    let dbSettings = await Settings.findOne();
    
    if (!dbSettings) {
      // Create default settings if none exist
      dbSettings = await Settings.create({
        institution: { /* default values */ },
        academic: { /* default values */ },
        // ... other settings
      });
    }

    res.json({ success: true, settings: dbSettings });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

### 3. Updated PUT Endpoint (`backend/routes/settings.js`)

The PUT `/settings/system` endpoint now:
- Validates required fields (institution name and academic year)
- Prepares update data from request body
- Uses `Settings.findOneAndUpdate()` with `upsert: true` to save to database
- Returns the updated settings with `success: true`

```javascript
router.put('/system', auth, authorize('admin'), async (req, res) => {
  try {
    const { institution, academic, notifications, security, features, attendancePolicy } = req.body;

    // Validate required fields
    if (!institution?.name || !academic?.currentAcademicYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Institution name and academic year are required' 
      });
    }

    // Prepare update data
    const updateData = {
      institution: { /* from request */ },
      academic: { /* from request */ },
      notifications: { /* from request */ },
      security: { /* from request */ },
      features: { /* from request */ },
      attendancePolicy: { /* from request */ }
    };

    // Update or create settings in database
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    res.json({ 
      success: true,
      message: 'System settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

### 4. Enhanced Logging (`android/src/screens/modules/SettingsScreen.tsx`)

Added comprehensive console logging to help debug:

**On Load:**
```typescript
console.log('Loading system settings...');
console.log('System settings response:', response);
console.log('Setting system settings:', response.settings);
```

**On Save:**
```typescript
console.log('Saving system settings:', systemSettings);
console.log('Save system settings response:', response);
console.log('✅ Settings saved successfully to database');
```

**On Error:**
```typescript
console.error('❌ Failed to save settings:', response);
console.error('Error details:', error.message, error.response);
```

## How to Verify the Fix

### 1. Check Backend Console Logs

When you save settings, you should see:
```
Updating system settings: { institution: { ... }, academic: { ... }, ... }
Update data: { institution: { ... }, academic: { ... }, ... }
Settings saved successfully: { _id: ..., institution: { ... }, ... }
```

### 2. Check Android Console Logs

In React Native debugger, you should see:
```
Loading system settings...
System settings response: { success: true, settings: { ... } }
Setting system settings: { institution: { ... }, ... }
Saving system settings: { institution: { ... }, ... }
Save system settings response: { success: true, message: '...', settings: { ... } }
✅ Settings saved successfully to database
```

### 3. Check MongoDB Database

You can verify the data is actually saved by:

**Using MongoDB Compass:**
1. Connect to your database
2. Navigate to the `settings` collection
3. You should see one document with all the settings

**Using MongoDB Shell:**
```bash
mongo
use your_database_name
db.settings.find().pretty()
```

You should see output like:
```json
{
  "_id": ObjectId("..."),
  "institution": {
    "name": "Your Institution Name",
    "address": "Your Address",
    "phone": "Your Phone",
    "email": "Your Email",
    "website": "Your Website"
  },
  "academic": {
    "currentAcademicYear": "2024",
    "currentSemester": "1st",
    "passPercentage": 40,
    "maxAttendancePercentage": 75
  },
  // ... other settings
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### 4. Test Persistence

1. Open the Settings screen in the Android app
2. Change institution name from "EduConnect University" to "My University"
3. Click "Save Settings"
4. You should see "Settings saved successfully!" message
5. Close and reopen the app
6. Navigate to Settings again
7. The institution name should still be "My University" (persisted from database)

## Testing Checklist

- [x] Settings Model updated with all fields
- [x] GET endpoint retrieves settings from database
- [x] GET endpoint creates default settings if none exist
- [x] PUT endpoint validates required fields
- [x] PUT endpoint saves settings to database using upsert
- [x] PUT endpoint returns success response with updated settings
- [x] Android app loads settings from database on mount
- [x] Android app saves settings to database on "Save" button click
- [x] Console logs added for debugging
- [x] Success/error messages displayed in UI
- [x] Settings persist across app restarts

## Related Files Modified

1. `backend/models/Settings.js` - Expanded schema with all settings
2. `backend/routes/settings.js` - Updated GET and PUT endpoints
3. `android/src/screens/modules/SettingsScreen.tsx` - Added logging

## Database Migration

No migration script is needed. The first time an admin accesses the settings:
- If no settings document exists, one will be created with defaults
- If an old settings document exists (with only `attendancePolicy`), it will be updated with new fields when settings are saved

## Future Improvements

1. **Validation**: Add more robust validation for phone numbers, emails, URLs
2. **Audit Trail**: Log who changed settings and when
3. **Version Control**: Keep history of settings changes
4. **Rollback**: Allow reverting to previous settings
5. **Backup**: Automatically backup settings before changes
6. **Multi-tenancy**: Support different settings for different institutions
7. **Environment Override**: Allow environment variables to override database settings for critical configs

## Troubleshooting

### Settings not saving
- Check backend console for error messages
- Verify user has admin role
- Check network connection
- Verify MongoDB is running and accessible

### Settings not loading
- Check if Settings collection exists in database
- Verify API endpoint is correct
- Check authentication token is valid
- Look for errors in Android console logs

### Old values showing after refresh
- Clear app cache
- Verify database has been updated (check MongoDB directly)
- Check if GET endpoint is being called (look for console logs)

## Support

If you encounter issues:
1. Check backend console logs
2. Check Android/React Native debugger console
3. Verify database connection
4. Test API endpoints directly with Postman
5. Check that all files have been updated correctly

