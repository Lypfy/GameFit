const express = require("express");
const router = express.Router();
const statisticsController = require("../controller/statistics.controller");

router.get("/general", statisticsController.getGeneralStats);
router.get("/wishlist", statisticsController.getWishlistStats);
router.get("/hardware", statisticsController.getHardwareStats);
router.get("/genres", statisticsController.getGenreStats);

module.exports = router;
