const router = require("express").Router();

router.post("/", (req, res) => {
  try {
    const { cmd } = req.body;
    const io = req.app.get("io");

    io.cmd.sendCmd(cmd);

    res.json({ ok: true, sent: cmd });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
