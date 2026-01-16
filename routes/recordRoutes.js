const router = require("express").Router();
const recordController = require("../controllers/recordController");

router.get("/start/:name", recordController.startRecord);
router.get("/stop", recordController.stopRecord);

module.exports = router;
