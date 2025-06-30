// models/AnalysisLog.js
module.exports = (sequelize, DataTypes) => {
  const AnalysisLog = sequelize.define(
    "AnalysisLog",
    {
      analysisId: DataTypes.UUID,
      editorId: DataTypes.INTEGER,
      action: DataTypes.STRING, // create | update | delete
      diff: DataTypes.JSON, // { before:{}, after:{} }
    },
    { timestamps: true }
  );
  AnalysisLog.associate = (db) => {
    AnalysisLog.belongsTo(db.User, { as: "editor", foreignKey: "editorId" });
    AnalysisLog.belongsTo(db.Analysis, {
      as: "analysis",
      foreignKey: "analysisId",
    });
  };
  return AnalysisLog;
};
