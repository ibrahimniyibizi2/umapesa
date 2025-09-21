export default (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // This is the table name
        key: 'id',
      }
    },
    recipientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    recipientPhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recipientCountry: {
      type: DataTypes.ENUM('rwanda', 'mozambique'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.ENUM('RWF', 'MZN'),
      allowNull: false
    },
    convertedAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true
    },
    convertedCurrency: {
      type: DataTypes.ENUM('RWF', 'MZN'),
      allowNull: true
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM('send', 'receive', 'deposit', 'withdraw'),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['reference'],
        unique: true
      }
    ]
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Transaction;
};
