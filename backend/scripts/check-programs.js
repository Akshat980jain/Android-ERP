require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

    const users = await User.find({ role: { $in: ['student', 'faculty'] } })
        .select('name email role program branch profile');

    console.log('=== ALL STUDENTS & FACULTY ===\n');
    users.forEach(u => {
        const prog = u.program || 'MISSING';
        const br = u.branch || 'none';
        const pc = u.profile?.course || 'none';
        console.log(`${u.name} (${u.email})`);
        console.log(`  role: ${u.role} | program: ${prog} | branch: ${br} | profile.course: ${pc}\n`);
    });

    // Fix users with program set to string "null"
    const nullStringUsers = await User.find({
        role: { $in: ['student', 'faculty'] },
        program: 'null'
    });

    if (nullStringUsers.length > 0) {
        console.log(`\nFIXING ${nullStringUsers.length} users with program="null" (string)...\n`);
        for (const u of nullStringUsers) {
            const newProg = u.profile?.course || null;
            // Try to detect from name if profile.course is also null
            let detected = newProg;
            if (!detected || detected === 'null') {
                const n = u.name.toLowerCase();
                if (n.includes('m.tech') || n.includes('mtech')) detected = 'M.Tech';
                else if (n.includes('b.tech') || n.includes('btech')) detected = 'B.Tech';
                else if (n.includes('mba')) detected = 'MBA';
                else if (n.includes('mca')) detected = 'MCA';
                else if (n.includes('b.pharma')) detected = 'B.Pharma';
            }
            if (detected && detected !== 'null') {
                u.program = detected;
                await u.save();
                console.log(`  FIXED: ${u.name} -> program: "${detected}"`);
            } else {
                console.log(`  SKIPPED: ${u.name} - could not auto-detect, needs manual fix`);
            }
        }
    }

    await mongoose.disconnect();
})();
