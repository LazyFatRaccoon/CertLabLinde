const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roles: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        const raw = this.getDataValue("roles");
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("roles", JSON.stringify(value));
      },
    },
    signature: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    location: {
      type: DataTypes.STRING,
      defaultValue: "Дніпро",
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

module.exports = User;
