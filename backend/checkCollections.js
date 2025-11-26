const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    console.log('\n=== EXISTING COLLECTIONS ===');
    if (collections.length === 0) {
      console.log('No collections found yet. They will be created when you start using the app.');
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
    }
    
    console.log(`\nTotal collections: ${collections.length}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollections(); 