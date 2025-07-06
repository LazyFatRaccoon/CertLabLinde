const { Sequelize } = require("sequelize");
const path = require("path");

const storagePath =
  process.env.SQLITE_PATH || path.join(__dirname, "../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: false,
});

module.exports = sequelize;
