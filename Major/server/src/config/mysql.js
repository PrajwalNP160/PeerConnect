import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create Sequelize instance using connection string
const sequelize = new Sequelize(process.env.TIDB_CONNECTION_STRING || process.env.MYSQL_CONNECTION_STRING, {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // For TiDB Cloud SSL
    },
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test the connection
export const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ MySQL models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    return false;
  }
};

export default sequelize;
