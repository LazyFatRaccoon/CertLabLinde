module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TemplateLog",
    {
      templateId: DataTypes.UUID,
      editorId: DataTypes.INTEGER,
      action: DataTypes.STRING, // create | update | delete
      diff: DataTypes.JSON, // { name, fields, … }
    },
    { timestamps: true }
  );
};
