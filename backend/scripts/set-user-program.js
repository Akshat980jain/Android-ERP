/**
 * Set the `program` field for specific users based on their name or role.
 * 
 * Usage:
 *   node scripts/set-user-program.js
 * 
 * This script will:
 * 1. Show all users who are missing the `program` field
 * 2. Auto-set program based on user name hints (e.g., "M.Tech" in name → program: "M.Tech")
 * 3. For users it can't auto-detect, it will show them so you can update manually
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ No MONGODB_URI or MONGO_URI found.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Find ALL students and faculty
    const users = await User.find({
        role: { $in: ['student', 'faculty'] }
    }).select('name email role program branch profile');

    console.log(`Total students/faculty: ${users.length}\n`);

    let needsFix = 0;
    let autoFixed = 0;

    for (const user of users) {
        const currentProgram = user.program;
        const profileCourse = user.profile?.course;

        console.log(`👤 ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role} | Branch: ${user.branch || 'none'}`);
        console.log(`   program: ${currentProgram || '❌ MISSING'} | profile.course: ${profileCourse || 'none'}`);

        if (!currentProgram || currentProgram === 'null') {
            needsFix++;

            // Try to auto-detect from profile.course first
            if (profileCourse && profileCourse !== 'null') {
                user.program = profileCourse;
                await user.save();
                console.log(`   ✅ AUTO-FIXED: program set to "${profileCourse}" (from profile.course)`);
                autoFixed++;
            }
            // Try to detect from user's name
            else if (user.name) {
                const nameLower = user.name.toLowerCase();
                let detected = null;
                if (nameLower.includes('m.tech') || nameLower.includes('mtech')) detected = 'M.Tech';
                else if (nameLower.includes('b.tech') || nameLower.includes('btech')) detected = 'B.Tech';
                else if (nameLower.includes('mba')) detected = 'MBA';
                else if (nameLower.includes('mca')) detected = 'MCA';
                else if (nameLower.includes('b.pharma') || nameLower.includes('bpharma')) detected = 'B.Pharma';

                if (detected) {
                    user.program = detected;
                    await user.save();
                    console.log(`   ✅ AUTO-FIXED: program set to "${detected}" (detected from name)`);
                    autoFixed++;
                } else {
                    console.log(`   ⚠️  NEEDS MANUAL FIX — could not auto-detect program`);
                }
            } else {
                console.log(`   ⚠️  NEEDS MANUAL FIX`);
            }
        } else {
            console.log(`   ✅ OK`);
        }
        console.log('');
    }

    console.log('='.repeat(50));
    console.log(`Total needing fix: ${needsFix}`);
    console.log(`Auto-fixed: ${autoFixed}`);
    console.log(`Remaining manual fixes needed: ${needsFix - autoFixed}`);

    if (needsFix - autoFixed > 0) {
        console.log('\n💡 To manually fix remaining users, run this in MongoDB shell:');
        console.log('   db.users.updateOne({ email: "user@email.com" }, { $set: { program: "B.Tech" } })');
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
