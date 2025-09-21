import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import UserModel from './user.js';
import TransactionModel from './transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(path.dirname(__dirname), '../data/database.sqlite'),
  logging: false // Set to console.log to see SQL queries
});

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Transaction = TransactionModel(sequelize, DataTypes);

// Define relationships
User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing database:', error);
    return false;
  }
};

// Create test data
const createTestData = async () => {
  try {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+250781234567',
      country: 'rwanda',
      isVerified: true,
      kycStatus: 'approved'
    });

    // Create test transactions
    await Transaction.bulkCreate([
      {
        userId: user.id,
        recipientName: 'John Doe',
        recipientPhone: '+250781234567',
        recipientCountry: 'rwanda',
        amount: 10000,
        currency: 'RWF',
        status: 'completed',
        type: 'send',
        reference: `TXN${Date.now()}`,
        fee: 100,
        totalAmount: 10100,
        createdAt: new Date()
      },
      {
        userId: user.id,
        recipientName: 'Jane Smith',
        recipientPhone: '+258841234567',
        recipientCountry: 'mozambique',
        amount: 500,
        currency: 'MZN',
        status: 'pending',
        type: 'send',
        reference: `TXN${Date.now() + 1}`,
        fee: 10,
        totalAmount: 510,
        createdAt: new Date()
      }
    ]);

    console.log('Test data created successfully');
    return true;
  } catch (error) {
    console.error('Error creating test data:', error);
    return false;
  }
};

export {
  sequelize,
  User,
  Transaction,
  syncDatabase,
  createTestData
};

export default {
  sequelize,
  User,
  Transaction,
  syncDatabase,
  createTestData
};
