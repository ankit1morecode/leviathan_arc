const router = require("express").Router();
const { sendRTB } = require("../services/cmdPublisher");

router.post("/cmd/rtb", async (req, res) => {
  try {
    await sendRTB();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
