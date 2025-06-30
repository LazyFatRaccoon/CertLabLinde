const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./User"); // вже імпортує sequelize всередині себе
db.UserLog = require("./UserLog")(sequelize, DataTypes);
db.Template = require("./Template")(sequelize, DataTypes); // викликаємо

db.TemplateLog = require("./TemplateLog")(sequelize, DataTypes);
db.TemplateLog.belongsTo(db.Template, {
  as: "template",
  foreignKey: "templateId",
});
db.TemplateLog.belongsTo(db.User, { as: "editor", foreignKey: "editorId" });

db.Template.belongsTo(db.User, { foreignKey: "createdBy", as: "author" });
db.UserLog.belongsTo(db.User, { as: "target", foreignKey: "userId" });
db.UserLog.belongsTo(db.User, { as: "editor", foreignKey: "editorId" });

db.Analysis = require("./Analysis")(sequelize, DataTypes);
db.Template.hasMany(db.Analysis, { foreignKey: "templateId" });
db.Analysis.belongsTo(db.Template, {
  foreignKey: "templateId",
  as: "template",
});
db.User.hasMany(db.Analysis, { foreignKey: "createdBy" });
db.Analysis.belongsTo(db.User, { as: "author", foreignKey: "createdBy" });

db.AnalysisLog = require("./AnalysisLog")(sequelize, DataTypes);

module.exports = db;
