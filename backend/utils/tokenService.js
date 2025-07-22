const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    roles: user.roles,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  console.log("✅ Згенеровано AccessToken:", token);
  console.log("📦 payload:", payload);

  return token;
}

function generateRefreshToken(user) {
  const payload = { id: user.id };

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  console.log("🔁 Згенеровано RefreshToken:", token);
  console.log("📦 payload (refresh):", payload);

  return token;
}

function verifyRefreshToken(token, callback) {
  console.log("🛡️ Перевірка refreshToken:", token);
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      console.log("⛔ Помилка перевірки refreshToken:", err.message);
    } else {
      console.log("✅ RefreshToken валідний, decoded:", decoded);
    }
    callback(err, decoded);
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
