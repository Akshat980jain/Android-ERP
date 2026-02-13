/**
 * Migration Script: Backfill `program` field for existing users
 * 
 * Run this once to fix existing users who have `profile.course` set but no `program` field.
 * 
 * Usage:
 *   node scripts/fix-program-field.js
 * 
 * Requires MONGODB_URI in the .env file (or set as environment variable).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ No MONGODB_URI or MONGO_URI found in environment.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find users who have profile.course set but no program (or program is null)
    const usersToFix = await User.find({
        $and: [
            { $or: [{ program: null }, { program: { $exists: false } }] },
            { 'profile.course': { $exists: true, $ne: null, $ne: '' } }
        ]
    });

    console.log(`Found ${usersToFix.length} users missing the program field`);

    let updated = 0;
    for (const user of usersToFix) {
        user.program = user.profile.course;
        await user.save();
        console.log(`  ✅ ${user.name} (${user.email}): program set to "${user.profile.course}"`);
        updated++;
    }

    console.log(`\n✅ Migration complete: ${updated} users updated`);
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
