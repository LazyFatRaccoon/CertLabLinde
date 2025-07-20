const express = require("express");
const authRoutes = require("./auth");
const usersRoutes = require("./users");
const logsRoutes = require("./logs");
const stampRoutes = require("./stamp");
const templateRoutes = require("./templates");
const signature = require("./signature");
const logsTemplatesRoutes = require("./logsTemplates");
const analysesRoutes = require("./analyses");
const publicRoutes = require("./public");
const settingsRoutes = require("./settings");
const exportCertificatesZipRoutes = require("./exportCertificatesZip");

const router = express.Router();

router.use("/settings", settingsRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/logs", logsRoutes);
router.use("/stamp", stampRoutes);
router.use("/templates", templateRoutes);
router.use("/signature", signature);
router.use("/logs", logsTemplatesRoutes);
router.use("/analyses", analysesRoutes);
router.use("/public", publicRoutes);
router.use("", exportCertificatesZipRoutes);

module.exports = router;
