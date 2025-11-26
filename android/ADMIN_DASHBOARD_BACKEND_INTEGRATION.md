# Admin Dashboard Backend Integration

## Overview
This document describes the backend integration for the Admin Dashboard in the Android app, enabling real-time data fetching and display.

## Implementation Details

### 1. API Methods Added (`android/src/services/api.ts`)

The following API methods were added to fetch admin statistics and manage data:

```typescript
// Get admin dashboard statistics
async getAdminStats(): Promise<ApiResponse<any>> {
  return this.request('/auth/admin-stats');
}

// Get department-wise enrollment data
async getDepartmentEnrollment(): Promise<ApiResponse<any>> {
  return this.request('/auth/department-enrollment');
}

// Get monthly revenue data
async getMonthlyRevenue(): Promise<ApiResponse<any>> {
  return this.request('/auth/monthly-revenue');
}

// Get pending verification requests
async getVerificationRequests(): Promise<ApiResponse<any>> {
  return this.request('/auth/verification-requests');
}

// Process verification request
async processVerificationRequest(
  id: string, 
  status: 'approved' | 'rejected', 
  remarks: string
): Promise<ApiResponse<any>> {
  return this.request(`/auth/verification-requests/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ status, remarks }),
  });
}
```

### 2. Dashboard Data Fetching

The `AdminDashboard.tsx` component fetches data using the following approach:

#### Primary Data Source: Admin Stats API
```typescript
const statsRes = await apiService.getAdminStats();
```

**Backend Response Format:**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "totalFaculty": 25,
    "totalCourses": 10,
    "totalRevenue": 450000
  }
}
```

#### Fallback: User List
If the admin stats endpoint fails, the dashboard falls back to fetching all users:
```typescript
const usersRes = await apiService.getAllUsers();
```

#### Notifications
Unread notification count is fetched separately:
```typescript
const notificationsRes = await apiService.getNotifications();
```

### 3. Data Display

The dashboard displays the following metrics in the System Overview card:

| Metric | Source | Display |
|--------|--------|---------|
| **Total Users** | `totalStudents + totalFaculty` | Combined count of all students and faculty |
| **Students** | `totalStudents` | Number of students in the system |
| **Faculty** | `totalFaculty` | Number of faculty members |
| **Alerts** | `unreadNotifications.length` | Count of unread notifications |

### 4. Error Handling

The implementation includes comprehensive error handling:

1. **Try-Catch Block**: All API calls are wrapped in try-catch
2. **Fallback Mechanism**: If primary API fails, falls back to user list
3. **Error Display**: Shows user-friendly error message in UI
4. **Console Logging**: Detailed logs for debugging:
   - Request initiation
   - Response data
   - Parsed statistics
   - Error details

```typescript
try {
  // Fetch data
  console.log('Fetching admin dashboard data...');
  const statsRes = await apiService.getAdminStats();
  console.log('Stats response:', statsRes);
  // ... process data
} catch (err: any) {
  console.error('Error refreshing dashboard:', err);
  setError('Failed to load dashboard data. Please check your connection.');
}
```

### 5. Pull-to-Refresh

The dashboard supports pull-to-refresh functionality:

```typescript
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh} 
      colors={[theme.colors.primary]} 
    />
  }
>
```

## Backend Endpoints

### 1. Admin Stats
- **Endpoint**: `GET /api/auth/admin-stats`
- **Auth**: Required (Admin only)
- **Returns**: Total students, faculty, courses, and revenue

### 2. All Users
- **Endpoint**: `GET /api/auth/all-users`
- **Auth**: Required (Admin only)
- **Returns**: Array of all users with their roles

### 3. Notifications
- **Endpoint**: `GET /api/notifications`
- **Auth**: Required
- **Returns**: Array of notifications with read/unread status

### 4. Department Enrollment
- **Endpoint**: `GET /api/auth/department-enrollment`
- **Auth**: Required (Admin only)
- **Returns**: Department-wise student enrollment data

### 5. Monthly Revenue
- **Endpoint**: `GET /api/auth/monthly-revenue`
- **Auth**: Required (Admin only)
- **Returns**: Monthly revenue breakdown

### 6. Verification Requests
- **Endpoint**: `GET /api/auth/verification-requests`
- **Auth**: Required (Admin only)
- **Returns**: Pending verification requests

## Testing

### Test Data Fetching

1. **Check Console Logs**:
   - Open React Native debugger
   - Look for "Fetching admin dashboard data..." messages
   - Verify response data is being received

2. **Test Pull-to-Refresh**:
   - Pull down on the dashboard
   - Verify loading indicator appears
   - Check if data updates

3. **Test Error Handling**:
   - Disable network connection
   - Pull to refresh
   - Verify error message appears

### Debugging

If data is not showing:

1. **Check Backend Connection**:
   ```javascript
   console.log('API Base URL:', apiService.baseURL);
   ```

2. **Verify Token**:
   ```javascript
   const token = await AsyncStorage.getItem('token');
   console.log('Auth Token:', token);
   ```

3. **Check Response Format**:
   ```javascript
   console.log('Stats response:', JSON.stringify(statsRes, null, 2));
   ```

4. **Test Backend Endpoint Directly**:
   - Use Postman or curl
   - Hit `/api/auth/admin-stats`
   - Verify response structure

## UI Components

### System Overview Card
Displays 4 key metrics in a 2x2 grid:
- Total Users (top-left)
- Students (top-right)
- Faculty (bottom-left)
- Alerts (bottom-right)

### Error Message Card
Shows when data fetching fails:
- Red background (#FEE2E2)
- Alert icon
- Error message text

### Loading State
- Displays during initial load
- Shows during pull-to-refresh
- Uses theme primary color

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live data updates
2. **Caching**: Add local caching to reduce API calls
3. **Charts**: Add visual charts for enrollment and revenue trends
4. **Filters**: Add date range filters for statistics
5. **Export**: Allow exporting statistics as PDF/Excel

## Troubleshooting

### Issue: Shows all zeros
**Solution**: 
- Check if backend is running
- Verify API base URL is correct
- Check console logs for errors
- Test backend endpoint directly

### Issue: Error message shown
**Solution**:
- Check network connection
- Verify authentication token is valid
- Check backend logs for errors
- Ensure user has admin role

### Issue: Data not refreshing
**Solution**:
- Force close and reopen app
- Clear AsyncStorage
- Check if onRefresh is being called
- Verify pull-to-refresh is working

## Related Files

- `android/src/screens/dashboard/AdminDashboard.tsx` - Dashboard UI component
- `android/src/services/api.ts` - API service with endpoints
- `backend/routes/auth.js` - Backend routes for admin stats
- `backend/models/User.js` - User model
- `backend/models/Fee.js` - Fee model for revenue calculations

