const router = require("express").Router();
const replayController = require("../controllers/replayController");

router.get("/:name", replayController.replay);

module.exports = router;
