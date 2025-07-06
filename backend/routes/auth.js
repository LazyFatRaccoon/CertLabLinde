// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { User, UserLog } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");
const { sendEmail } = require("../utils/emailService");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenService");
const crypto = require("crypto");

let refreshTokens = [];

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("hello");
  try {
    console.log("login attempt:", email);
    const user = await User.findOne({ where: { email } });
    console.log("→ trying login", email, "pwd:", password);
    console.log("stored hash:", user.password.substring(0, 20), "…");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("bcrypt.compare → false");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);

    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        signature: user.signature,
        location: user.location,
        loginCount: user.loginCount,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("[LOGIN] ❌ error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/refresh-token", (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  if (!refreshTokens.includes(token)) return res.sendStatus(403);

  verifyRefreshToken(token, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.sendStatus(404);

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  });
});

router.post("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((t) => t !== req.cookies.refreshToken);
  res.clearCookie("refreshToken").sendStatus(204);
});

router.get("/me", authenticateToken, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    location: user.location,
    signature: user.signature,
    loginCount: user.loginCount,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  });
});

router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const tempPassword = crypto.randomBytes(4).toString("hex");
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();

    await sendEmail(
      email,
      "Відновлення паролю",
      `Ваш новий тимчасовий пароль: ${tempPassword}`
    );

    res.json({ message: "Temporary password sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/register",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    let { name, email, roles, signature, location } = req.body;
    if (typeof roles === "string") roles = JSON.parse(roles);

    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });

      const randomPassword = crypto.randomBytes(4).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        roles,
        signature: signature || "",
        location: location || "Дніпро",
        loginCount: 0,
        lastLogin: null,
      });

      await UserLog.create({
        userId: newUser.id,
        editorId: req.user.id,
        action: "create",
        field: Object.keys(newUser.dataValues).join(","), // name,email,roles,…
        oldValue: null,
        newValue: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          roles: newUser.roles,
          location: newUser.location,
        }),
      });
      console.log("Sending email to:", email);
      await sendEmail(
        email,
        "Ваш тимчасовий пароль",
        `Ваш тимчасовий пароль: ${randomPassword}`
      );

      res.status(201).json({
        message: "User created and password sent to email",
        user: newUser,
      });
    } catch (error) {
      console.error("POST /register error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;
