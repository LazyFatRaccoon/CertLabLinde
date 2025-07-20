// models/Setting.js
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    "Setting",
    {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue("value");
          return Array.isArray(rawValue) ? rawValue : [];
        },
      },
    },
    {
      tableName: "settings",
    }
  );

  return Setting;
};
