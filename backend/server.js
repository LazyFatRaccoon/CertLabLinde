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

app.use(
  cors({
    origin: "http://localhost:3000", // де крутиться ваша React-апка
    credentials: true, // <-- дозволяємо cookies / auth-заголовки
  })
);
app.use(express.json());
app.use(cookieParser());

// Статичні файли
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Основні маршрути
app.use("/api", routes);

// Ініціалізація БД та запуск сервера
(async () => {
  try {
    await db.sequelize.sync();

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

    console.log("Database synced");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS ? "✓ loaded" : "✗ missing"
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
