const express = require("express");
const router = express.Router();
const hardwareController = require("../controllers/hardware.controller");
const { verifyToken, requireAdmin } = require("../middlewares/auth.middleware");

router.get("/", hardwareController.getHardwareList);
router.post("/", verifyToken, requireAdmin, hardwareController.addHardware);

module.exports = router;
