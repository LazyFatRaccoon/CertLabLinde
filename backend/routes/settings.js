const express = require("express");
const router = express.Router();
const { Setting } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");

function generateNumericId(array) {
  const maxId = array.reduce((max, item) => Math.max(max, item.id || 0), 0);
  return maxId + 1;
}

async function updateArraySetting(key, newValue, res) {
  try {
    const setting = await Setting.findOne({ where: { key } });
    const value = Array.isArray(newValue.value) ? newValue.value : newValue;
    if (!setting) {
      const created = await Setting.create({ key, value });
      return res.status(201).json(created.value);
    }
    await setting.update({ value });
    return res.json(value);
  } catch (err) {
    console.error(`PUT /settings/${key} error:`, err);
    return res.status(500).json({ message: "Помилка оновлення" });
  }
}

router.get("/locations", authenticateToken, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: "locations" } });
    res.json(setting ? setting.value : []);
  } catch (err) {
    console.error("GET /settings/locations error:", err);
    res.status(500).json({ message: "Помилка отримання локацій" });
  }
});

router.get("/products", authenticateToken, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: "products" } });
    res.json(setting ? setting.value : []);
  } catch (err) {
    console.error("GET /settings/products error:", err);
    res.status(500).json({ message: "Помилка отримання продуктів" });
  }
});

router.put(
  "/locations",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    updateArraySetting("locations", req.body, res);
  }
);

router.put(
  "/products",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    updateArraySetting("products", req.body, res);
  }
);

router.patch(
  "/locations/add",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { itemName } = req.body;
      if (!itemName) return res.status(400).json({ message: "Немає itemName" });

      const setting = await Setting.findOne({ where: { key: "locations" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = [
        ...setting.value,
        { id: generateNumericId(setting.value), name: itemName },
      ];
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/locations/add error:", err);
      res.status(500).json({ message: "Помилка додавання" });
    }
  }
);

router.patch(
  "/products/add",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { itemName } = req.body;
      if (!itemName) return res.status(400).json({ message: "Немає itemName" });

      const setting = await Setting.findOne({ where: { key: "products" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = [
        ...setting.value,
        { id: generateNumericId(setting.value), name: itemName },
      ];
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/products/add error:", err);
      res.status(500).json({ message: "Помилка додавання" });
    }
  }
);

router.patch(
  "/locations/rename",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { id, newName } = req.body;
      const setting = await Setting.findOne({ where: { key: "locations" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = setting.value.map((val) =>
        val.id === id ? { ...val, name: newName } : val
      );
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/locations/rename error:", err);
      res.status(500).json({ message: "Помилка перейменування" });
    }
  }
);

router.patch(
  "/products/rename",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { id, newName } = req.body;
      const setting = await Setting.findOne({ where: { key: "products" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = setting.value.map((val) =>
        val.id === id ? { ...val, name: newName } : val
      );
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/products/rename error:", err);
      res.status(500).json({ message: "Помилка перейменування" });
    }
  }
);

router.patch(
  "/locations/remove",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { id } = req.body;
      const setting = await Setting.findOne({ where: { key: "locations" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = setting.value.filter((val) => val.id !== id);
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/locations/remove error:", err);
      res.status(500).json({ message: "Помилка видалення" });
    }
  }
);

router.patch(
  "/products/remove",
  authenticateToken,
  onlySupervisors,
  async (req, res) => {
    try {
      const { id } = req.body;
      const setting = await Setting.findOne({ where: { key: "products" } });
      if (!setting) return res.status(404).json({ message: "Не знайдено" });

      const updated = setting.value.filter((val) => val.id !== id);
      await setting.update({ value: updated });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /settings/products/remove error:", err);
      res.status(500).json({ message: "Помилка видалення" });
    }
  }
);

module.exports = router;
