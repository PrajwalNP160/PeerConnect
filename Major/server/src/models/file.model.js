import { DataTypes } from 'sequelize';
import sequelize from '../config/mysql.js';

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fileData: {
    type: DataTypes.BLOB('long'), // For storing binary data
    allowNull: false,
  },
  fileType: {
    type: DataTypes.ENUM('certificate', 'resource', 'avatar', 'project'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  uploadedBy: {
    type: DataTypes.STRING, // MongoDB User ID
    allowNull: false,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'files',
  timestamps: true,
  indexes: [
    {
      fields: ['uploadedBy']
    },
    {
      fields: ['fileType']
    },
    {
      fields: ['fileName']
    }
  ]
});

export default File;
