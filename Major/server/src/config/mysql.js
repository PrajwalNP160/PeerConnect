import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'skillswap_db',
  process.env.MYSQL_USERNAME || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

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
