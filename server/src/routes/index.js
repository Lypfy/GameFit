const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const gameRoutes = require("./game.routes");
const hardwareRoutes = require("./hardware.routes");

router.use("/auth", authRoutes);
router.use("/games", gameRoutes);
router.use("/hardware", hardwareRoutes);

module.exports = router;
