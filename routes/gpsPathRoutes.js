const express = require("express");
const router = express.Router();
const GpsPath = require("../models/GpsPath");

router.post("/start", async (req, res) => {
  const { robot_id, name } = req.body;
  if (!robot_id || !name) return res.status(400).json({ message: "robot_id and name required" });

  await GpsPath.updateOne(
    { robot_id, name },
    { $set: { points: [] } },
    { upsert: true }
  );

  res.json({ message: "record started", robot_id, name });
});

router.post("/point", async (req, res) => {
  const { robot_id, name, lat, lng } = req.body;

  if (!robot_id || !name) return res.status(400).json({ message: "robot_id and name required" });
  if (typeof lat !== "number" || typeof lng !== "number")
    return res.status(400).json({ message: "lat and lng must be number" });

  await GpsPath.updateOne(
    { robot_id, name },
    { $push: { points: { lat, lng, ts: Date.now() } } },
    { upsert: true }
  );

  res.json({ message: "point added" });
});

router.get("/list/:robot_id", async (req, res) => {
  const { robot_id } = req.params;
  const list = await GpsPath.find({ robot_id })
  .select("_id name createdAt updatedAt")
  .sort({ updatedAt: -1 });

  res.json(list);
});

router.get("/:robot_id/:name", async (req, res) => {
  const { robot_id, name } = req.params;
  const path = await GpsPath.findOne({ robot_id, name });

  if (!path) return res.status(404).json({ message: "Path not found" });

  res.json(path.points || []);
});

router.get("/", async (req, res) => {
  try {
    const paths = await GpsPath.find().sort({ createdAt: -1 });
    res.json(paths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await GpsPath.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Path not found" });
    }

    res.json({ message: "Path deleted successfully", deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
