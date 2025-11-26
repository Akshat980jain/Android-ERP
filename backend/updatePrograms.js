const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akshat980jain:gg81I8BnmGzUSl6P@cluster0.gtqycfa.mongodb.net/erp?retryWrites=true&w=majority&appName=Cluster0';

// Course Schema - flexible to match your existing structure
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    default: 0
  },
  semester: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schedule: [{
    type: String
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxCapacity: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subjects: [{
    type: String
  }]
}, {
  timestamps: true,
  strict: false // Allow additional fields like in your existing data
});

const Course = mongoose.model('Course', courseSchema);

// Degree Programs to be added as courses
const degreeProgramCourses = [
  {
    name: "Bachelor of Technology",
    code: "BTECH001",
    description: "Undergraduate engineering degree program focusing on technical and practical skills in various engineering disciplines",
    credits: 180, // Total credits for the program
    semester: 8, // Total semesters
    department: "Engineering",
    schedule: ["4 Years Full Time"],
    maxCapacity: 120,
    isActive: true,
    programType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Chemistry, Mathematics"
  },
  {
    name: "Bachelor of Pharmacy",
    code: "BPHARMA001",
    description: "Undergraduate program in pharmaceutical sciences covering drug development, manufacturing, and healthcare",
    credits: 150, // Total credits for the program
    semester: 8, // Total semesters
    department: "Pharmacy",
    schedule: ["4 Years Full Time"],
    maxCapacity: 60,
    isActive: true,
    programType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Chemistry, Biology/Mathematics"
  },
  {
    name: "Master of Computer Applications",
    code: "MCA001",
    description: "Postgraduate program in computer applications focusing on software development, programming, and IT solutions",
    credits: 120, // Total credits for the program
    semester: 6, // Total semesters
    department: "Computer Applications",
    schedule: ["3 Years Full Time"],
    maxCapacity: 80,
    isActive: true,
    programType: "Postgraduate",
    duration: "3 Years",
    eligibility: "Bachelor's degree with Mathematics at 10+2 or graduation level"
  },
  {
    name: "Master of Business Administration",
    code: "MBA001",
    description: "Postgraduate management program covering business strategy, leadership, finance, marketing, and operations",
    credits: 90, // Total credits for the program
    semester: 4, // Total semesters
    department: "Management Studies",
    schedule: ["2 Years Full Time"],
    maxCapacity: 100,
    isActive: true,
    programType: "Postgraduate",
    duration: "2 Years",
    eligibility: "Bachelor's degree in any discipline with minimum 50% marks"
  },
  {
    name: "Master of Technology",
    code: "MTECH001",
    description: "Postgraduate engineering program for advanced study in specialized engineering and technology fields",
    credits: 80, // Total credits for the program
    semester: 4, // Total semesters
    department: "Engineering",
    schedule: ["2 Years Full Time"],
    maxCapacity: 40,
    isActive: true,
    programType: "Postgraduate",
    duration: "2 Years",
    eligibility: "Bachelor's degree in Engineering/Technology with minimum 60% marks"
  }
];

// Migration functions
async function addDegreeProgramsAsCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing courses if needed (uncomment if you want to replace all)
    // const deleteResult = await Course.deleteMany({});
    // console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing courses`);

    // Insert degree programs as courses
    console.log('📚 Adding degree programs as courses...\n');

    const insertedCourses = await Course.insertMany(degreeProgramCourses);
    console.log(`✅ Successfully inserted ${insertedCourses.length} degree program courses\n`);

    // Display inserted courses
    console.log('📋 Added Degree Programs:');
    console.log('=' .repeat(80));
    
    insertedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name}`);
      console.log(`   Code: ${course.code}`);
      console.log(`   Department: ${course.department}`);
      console.log(`   Duration: ${course.duration}`);
      console.log(`   Capacity: ${course.maxCapacity} students`);
      console.log(`   Type: ${course.programType}`);
      console.log(`   Credits: ${course.credits}`);
      console.log(`   Description: ${course.description.substring(0, 80)}...`);
      console.log('   ' + '-'.repeat(75));
    });

    // Verify the insertion
    const totalCourses = await Course.countDocuments({ isActive: true });
    console.log(`\n📊 Total active courses in database: ${totalCourses}`);

    // Show summary by department
    const departmentSummary = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n🏢 Courses by Department:');
    departmentSummary.forEach(dept => {
      console.log(`   ${dept._id}: ${dept.count} course(s)`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('⚠️  Duplicate course code found. Course may already exist.');
      console.error('🔍 Duplicate details:', error.keyValue);
      console.log('\n💡 Try using the upsert function instead to update existing courses.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Upsert function - updates existing or inserts new
async function upsertDegreeProgramsAsCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let insertedCount = 0;
    let updatedCount = 0;

    console.log('🔄 Upserting degree programs as courses...\n');

    for (const courseData of degreeProgramCourses) {
      const result = await Course.updateOne(
        { code: courseData.code }, // Find by course code
        { $set: courseData }, // Update with new data
        { upsert: true } // Create if doesn't exist
      );

      if (result.upsertedCount > 0) {
        insertedCount++;
        console.log(`✨ Inserted: ${courseData.name} (${courseData.code})`);
      } else if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`🔄 Updated: ${courseData.name} (${courseData.code})`);
      } else {
        console.log(`ℹ️  No changes: ${courseData.name} (${courseData.code})`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✨ Inserted: ${insertedCount} courses`);
    console.log(`   🔄 Updated: ${updatedCount} courses`);
    console.log(`   📚 Total processed: ${degreeProgramCourses.length} courses`);

    // Show final state
    const allCourses = await Course.find({ isActive: true }).select('name code department');
    console.log('\n📋 All Active Courses in Database:');
    console.log('=' .repeat(60));
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} (${course.code}) - ${course.department}`);
    });

  } catch (error) {
    console.error('❌ Upsert migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Function to clear all courses and start fresh
async function replaceAllCoursesWithDegreePrograms() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all existing courses
    const deleteResult = await Course.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing courses`);

    // Insert new degree program courses
    const insertedCourses = await Course.insertMany(degreeProgramCourses);
    console.log(`✨ Successfully replaced with ${insertedCourses.length} degree program courses`);

    console.log('\n🎯 Database now contains only these degree programs:');
    insertedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} (${course.code})`);
    });

  } catch (error) {
    console.error('❌ Replace migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

const degreeNames = [
  'B.Tech', 'B.Pharma', 'MCA', 'MBA', 'M.Tech',
  'Bachelor of Technology', 'Bachelor of Pharmacy', 'Master of Computer Applications', 'Master of Business Administration', 'Master of Technology'
];

async function migrateUserAndRoleRequestPrograms() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const RoleRequest = mongoose.model('RoleRequest', new mongoose.Schema({}, { strict: false }));

  // Users: migrate 'course' and 'program' to 'courses' array, add 'subjects' as empty array
  const userResult = await User.updateMany(
    {
      $or: [
        { course: { $in: degreeNames } },
        { program: { $in: degreeNames } }
      ]
    },
    [
      {
        $set: {
          courses: [
            { $ifNull: ["$course", "$program"] }
          ],
          subjects: []
        }
      },
      { $unset: ["course", "program"] }
    ]
  );
  console.log(`Users migrated: ${userResult.modifiedCount}`);

  // RoleRequests: migrate 'course' and 'program' to 'courses' array, add 'subjects' as empty array
  const reqResult = await RoleRequest.updateMany(
    {
      $or: [
        { course: { $in: degreeNames } },
        { program: { $in: degreeNames } }
      ]
    },
    [
      {
        $set: {
          courses: [
            { $ifNull: ["$course", "$program"] }
          ],
          subjects: []
        }
      },
      { $unset: ["course", "program"] }
    ]
  );
  console.log(`RoleRequests migrated: ${reqResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log('User/RoleRequest migration complete!');
}

// Export functions
module.exports = {
  addDegreeProgramsAsCourses,
  upsertDegreeProgramsAsCourses,
  replaceAllCoursesWithDegreePrograms,
  degreeProgramCourses,
  Course,
  migrateUserAndRoleRequestPrograms
};

// Main execution
if (require.main === module) {
  console.log('🚀 Starting Degree Programs Migration...\n');
  
  const args = process.argv.slice(2);
  const operation = args[0] || 'upsert';

  switch (operation) {
    case 'insert':
      console.log('📝 Mode: Insert new courses (will fail if duplicates exist)');
      addDegreeProgramsAsCourses();
      break;
    case 'replace':
      console.log('🔄 Mode: Replace all existing courses');
      replaceAllCoursesWithDegreePrograms();
      break;
    case 'migrate-users':
      console.log('🔄 Mode: Migrate User and RoleRequest collections to new courses/subjects schema');
      migrateUserAndRoleRequestPrograms();
      break;
    case 'upsert':
    default:
      console.log('🔄 Mode: Upsert courses (update existing, insert new)');
      upsertDegreeProgramsAsCourses();
      break;
  }
}

// Usage instructions
console.log(`
📖 Usage Instructions:
  node script.js              # Upsert mode (default - recommended)
  node script.js insert       # Insert only (fails on duplicates)  
  node script.js replace      # Replace all existing courses
  node script.js upsert       # Upsert mode (explicit)
  node script.js migrate-users # Migrate User and RoleRequest collections to new schema
`);