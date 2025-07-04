require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models");
const bcrypt = require("bcrypt");
const routes = require("./routes");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

/* 🔹 4. API */
app.use("/api", routes);

/* 🔹 5. React build (лише в production) */
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend", "build")));
  app.get("*", (_, res) =>
    res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"))
  );
}

/* 🔹 6. Ініціалізація БД та сервер */
(async () => {
  try {
    await db.sequelize.sync();

    // створюємо admin, якщо потрібен
    const userCount = await db.User.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await db.User.create({
        name: "Admin",
        email: "vladimir.todorov.ukraine@gmail.com",
        password: hashedPassword,
        roles: ["supervisor"],
        signature: "",
      });
      console.log("Default supervisor created");
    }

    app.listen(PORT, () => console.log(`🌐 Server running on ${PORT}`));
  } catch (err) {
    console.error("Unable to connect to DB:", err);
  }
})();
