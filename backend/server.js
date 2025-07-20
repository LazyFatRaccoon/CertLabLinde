require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models");
const bcrypt = require("bcrypt");
const routes = require("./routes");
const cookieParser = require("cookie-parser");
const constants = require("./constants/settings");
const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || __dirname;

const origUse = express.Router.prototype.use;
const origRoute = express.Router.prototype.route;

function logArg(arg) {
  if (typeof arg === "string") console.log("🔎 registering:", arg);
}

express.Router.prototype.use = function (path, ...rest) {
  logArg(path);
  return origUse.call(this, path, ...rest);
};
express.Router.prototype.route = function (path) {
  logArg(path);
  return origRoute.call(this, path);
};

const fs = require("fs");
["uploads", "public"].forEach((dir) => {
  const full = path.join(DATA_DIR, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

/* 🔹 1. CORS: різні origin у dev і prod */
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"; // задаємо в .env.dev
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

/* 🔹 2. Мідлвари */
app.use(express.json());
app.use(cookieParser());

/* 🔹 3. Статика, що НЕ належить React-білду */
app.use("/uploads", express.static(path.join(DATA_DIR, "uploads")));
app.use(
  "/public",
  (req, res, next) => {
    res.set("Access-Control-Allow-Origin", CLIENT_URL); // або точний origin
    next();
  },
  express.static(path.join(DATA_DIR, "public"), {
    // 2. Явно оголосимо content-type для pdf, щоб не було CORB-warning
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  })
);

/* 🔹 4. API */
app.use("/api", routes);

if (app._router) {
  app._router.stack
    .filter((r) => r.route)
    .forEach((r) => console.log("⛳ route:", r.route.path));
}

/* 🔹 5. React build (лише в production) */
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend", "build")));
  app.get(/.*/, (_, res) =>
    res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"))
  );
}

/* 🔹 6. Ініціалізація БД та сервер */
(async () => {
  try {
    await db.sequelize.sync();

    // 🔸 Ініціалізація settings
    const { Setting } = db;
    const { locations, products } = constants;
    console.log("locations", locations);
    const settingCount = await Setting.count();
    if (settingCount === 0) {
      await Setting.bulkCreate([
        { key: "locations", value: locations },
        { key: "products", value: products },
      ]);
      const allSettings = await Setting.findAll();
      console.log(
        "🛠 Збережені settings:",
        allSettings.map((s) => ({ key: s.key, value: s.value }))
      );
    }
    // 🔸 Створюємо admin, якщо потрібен
    const userCount = await db.User.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("admin", 10);

      const firstLocationSetting = await Setting.findOne({
        where: { key: "location" },
        order: [["id", "ASC"]],
      });

      const defaultLocation =
        firstLocationSetting && Array.isArray(firstLocationSetting.value)
          ? firstLocationSetting.value[0] || "Дніпро"
          : "Дніпро";

      await db.User.create({
        name: "Admin",
        email: "vladimir.todorov.ukraine@gmail.com",
        password: hashedPassword,
        roles: ["supervisor"],
        signature: "",
        location: defaultLocation,
      });

      console.log(
        "👤 Default supervisor created with location:",
        defaultLocation
      );
    }
    app.listen(PORT, () => console.log(`🌐 Server running on ${PORT}`));
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();
