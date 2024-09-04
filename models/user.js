module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      groupIDList: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "user",
      timestamps: false, // Set to true if you have createdAt and updatedAt columns
    }
  );

  return User;
};
