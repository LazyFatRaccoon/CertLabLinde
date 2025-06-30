module.exports = (sequelize, DataTypes) => {
  const Analysis = sequelize.define(
    "Analysis",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      data: { type: DataTypes.JSON },
      templateId: DataTypes.UUID,
      createdBy: DataTypes.INTEGER,
    },
    { timestamps: true, paranoid: true }
  );

  return Analysis;
};
