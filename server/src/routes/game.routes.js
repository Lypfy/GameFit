const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");

router.get("/", gameController.getAllGames);
router.get("/:id", gameController.getGameById);
router.post("/:gameId/check-compatibility", gameController.checkGameCompatibility);

module.exports = router;
