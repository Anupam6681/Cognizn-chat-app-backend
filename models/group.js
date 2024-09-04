module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define(
    "Group",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
      },
      group_name: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      sid: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      createDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "group",
      timestamps: true, // Automatically manage `createdAt` and `updatedAt` columns
      createdAt: "createDate", // Map to the existing createDate column
      updatedAt: "updateDate", // Map to the existing updateDate column
    }
  );

  return Group;
};
