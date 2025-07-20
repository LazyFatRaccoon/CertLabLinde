module.exports = (sequelize, DataTypes) => {
  const Template = sequelize.define(
    "Template",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      bgFile: { type: DataTypes.STRING }, // /public/templates/<id>.png|pdf
      width: { type: DataTypes.INTEGER, allowNull: true },
      height: { type: DataTypes.INTEGER, allowNull: true },

      fields: {
        // нормалізований масив
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      createdBy: { type: DataTypes.INTEGER },
      updatedBy: { type: DataTypes.INTEGER },
    },
    { timestamps: true, paranoid: true }
  );

  return Template;
};
