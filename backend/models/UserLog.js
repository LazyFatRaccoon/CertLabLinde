module.exports = (sequelize, DataTypes) => {
  const UserLog = sequelize.define("UserLog", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    editorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false, // 'create', 'update', 'delete'
    },
    field: {
      type: DataTypes.TEXT, //
    },
    oldValue: {
      type: DataTypes.TEXT, // JSON.stringify({ name:"Ivan", location:"Dnipro" })
    },
    newValue: {
      type: DataTypes.TEXT, // JSON.stringify({ name:"Ivan P.2", location:"Kyiv" })
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return UserLog;
};
