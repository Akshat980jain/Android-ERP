// Migration script to fix existing data
const mongoose = require('mongoose');
const RoleRequest = require('./path/to/your/roleRequestModel');
const User = require('./path/to/your/userModel');

async function migrateRoleRequestData() {
  try {
    console.log('Starting role request data migration...');

    // Find all role requests with missing required fields
    const problematicRequests = await RoleRequest.find({
      $or: [
        { user: { $exists: false } },
        { user: null },
        { currentRole: { $exists: false } },
        { currentRole: null },
        { currentRole: '' },
        { reason: { $exists: false } },
        { reason: null },
        { reason: '' }
      ]
    });

    console.log(`Found ${problematicRequests.length} requests with missing data`);

    let fixed = 0;
    let failed = 0;

    for (const request of problematicRequests) {
      try {
        let needsUpdate = false;

        // Fix missing user (this should not happen, but just in case)
        if (!request.user) {
          console.log(`Warning: Request ${request._id} has no user - this may need manual intervention`);
          continue;
        }

        // Fix missing currentRole
        if (!request.currentRole) {
          const user = await User.findById(request.user);
          if (user && user.role) {
            request.currentRole = user.role;
          } else {
            request.currentRole = 'none'; // Default value
          }
          needsUpdate = true;
          console.log(`Fixed currentRole for request ${request._id}`);
        }

        // Fix missing reason
        if (!request.reason || request.reason.trim() === '') {
          request.reason = 'No reason provided'; // Default reason
          needsUpdate = true;
          console.log(`Fixed reason for request ${request._id}`);
        }

        if (needsUpdate) {
          await request.save();
          fixed++;
        }

      } catch (error) {
        console.error(`Failed to fix request ${request._id}:`, error.message);
        failed++;
      }
    }

    console.log(`Migration completed: ${fixed} fixed, ${failed} failed`);
    
    // Verify the migration
    const remainingProblems = await RoleRequest.find({
      $or: [
        { user: { $exists: false } },
        { user: null },
        { currentRole: { $exists: false } },
        { currentRole: null },
        { currentRole: '' },
        { reason: { $exists: false } },
        { reason: null },
        { reason: '' }
      ]
    });

    if (remainingProblems.length === 0) {
      console.log('✅ Migration successful - no remaining issues');
    } else {
      console.log(`⚠️ ${remainingProblems.length} requests still have issues`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
if (require.main === module) {
  mongoose.connect('your-mongodb-connection-string')
    .then(() => {
      console.log('Connected to database');
      return migrateRoleRequestData();
    })
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

module.exports = { migrateRoleRequestData };