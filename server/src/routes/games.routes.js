const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', gamesController.getGames);
router.get('/:game_id', gamesController.getGameDetail);
router.get('/:game_id/game_requirement', gamesController.getGameRequirement);
router.get('/:game_id/compatibility/:pc_id', verifyToken, gamesController.checkGameCompatibility);

module.exports = router;