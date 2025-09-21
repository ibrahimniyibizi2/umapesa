import { sequelize } from '../config/database.js';
import { User, Transaction, syncDatabase, createTestData } from '../models/index.js';

// Test data creation is now handled in the models/index.js file

const initDatabase = async () => {
  try {
    // Sync all models
    await syncDatabase();
    
    // Create test data
    await createTestData();
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run the initialization
initDatabase();
