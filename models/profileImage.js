module.exports = (sequelize, DataTypes) => {
  const ProfileImage = sequelize.define(
    "ProfileImage",
    {
      imageID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        unique: true, // This ensures that userId is unique across the table
      },
      groupId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        unique: true, // This ensures that userId is unique across the table
      },
      publicID: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING(1024),
        allowNull: true,
      },
      createDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      lastUpdateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "profile_image",
      timestamps: true, // Automatically manage `createdAt` and `updatedAt` columns
      createdAt: "createDate", // Map to the existing createDate column
      updatedAt: "lastUpdateDate", // Map to the existing lastUpdateDate column
    }
  );

  return ProfileImage;
};
