// Controller method for approving role requests
const approveRoleRequest = async (req, res) => {
    try {
      const { requestId } = req.params;
      const { remarks } = req.body;
      const reviewerId = req.user.id; // Assuming you have user info in req.user
  
      // Find the role request
      const roleRequest = await RoleRequest.findById(requestId).populate('user');
      
      if (!roleRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role request not found' 
        });
      }
  
      // Check if already processed
      if (roleRequest.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Role request has already been processed' 
        });
      }
  
      // Validate required fields - handle missing data gracefully
      if (!roleRequest.user) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot approve: user information is missing' 
        });
      }
  
      if (!roleRequest.reason || roleRequest.reason.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot approve: reason is missing' 
        });
      }
  
      // Set currentRole if missing (fallback to user's current role or 'none')
      if (!roleRequest.currentRole) {
        const user = await User.findById(roleRequest.user._id);
        roleRequest.currentRole = user?.role || 'none';
      }
  
      // Update the role request
      roleRequest.status = 'approved';
      roleRequest.reviewedBy = reviewerId;
      roleRequest.reviewedAt = new Date();
      if (remarks) {
        roleRequest.remarks = remarks;
      }
  
      await roleRequest.save();
  
      // Update user's role
      await User.findByIdAndUpdate(roleRequest.user._id, {
        role: roleRequest.requestedRole
      });
  
      res.json({
        success: true,
        message: 'Role request approved successfully',
        data: roleRequest
      });
  
    } catch (error) {
      console.error('Error approving role request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
  // Alternative: Batch approval with validation
  const batchApproveRoleRequests = async (req, res) => {
    try {
      const { requestIds, remarks } = req.body;
      const reviewerId = req.user.id;
      
      const results = [];
      
      for (const requestId of requestIds) {
        try {
          const roleRequest = await RoleRequest.findById(requestId).populate('user');
          
          if (!roleRequest || roleRequest.status !== 'pending') {
            results.push({
              requestId,
              success: false,
              message: 'Request not found or already processed'
            });
            continue;
          }
  
          // Validate and fix missing fields
          let hasErrors = false;
          const errors = [];
  
          if (!roleRequest.user) {
            errors.push('Missing user information');
            hasErrors = true;
          }
  
          if (!roleRequest.reason || roleRequest.reason.trim() === '') {
            errors.push('Missing reason');
            hasErrors = true;
          }
  
          if (!roleRequest.currentRole) {
            // Try to get current role from user
            const user = await User.findById(roleRequest.user?._id);
            if (user) {
              roleRequest.currentRole = user.role || 'none';
            } else {
              errors.push('Cannot determine current role');
              hasErrors = true;
            }
          }
  
          if (hasErrors) {
            results.push({
              requestId,
              success: false,
              message: `Validation failed: ${errors.join(', ')}`
            });
            continue;
          }
  
          // Approve the request
          roleRequest.status = 'approved';
          roleRequest.reviewedBy = reviewerId;
          roleRequest.reviewedAt = new Date();
          if (remarks) {
            roleRequest.remarks = remarks;
          }
  
          await roleRequest.save();
  
          // Update user role
          await User.findByIdAndUpdate(roleRequest.user._id, {
            role: roleRequest.requestedRole
          });
  
          results.push({
            requestId,
            success: true,
            message: 'Approved successfully'
          });
  
        } catch (error) {
          results.push({
            requestId,
            success: false,
            message: `Error: ${error.message}`
          });
        }
      }
  
      res.json({
        success: true,
        message: 'Batch approval completed',
        results
      });
  
    } catch (error) {
      console.error('Error in batch approval:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
  module.exports = {
    approveRoleRequest,
    batchApproveRoleRequests
  };