module.exports = (sequelize, DataTypes) => {
  const Counter = sequelize.define("Counter", {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return Counter;
};
