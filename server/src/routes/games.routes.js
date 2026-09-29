const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', gamesController.getGames);
router.get('/tag/:tag_id', gamesController.getGameByTag);
router.get('/:game_id', gamesController.getGameDetail);
router.get('/:game_id/game_requirement', gamesController.getGameRequirement);
router.get('/:game_id/compatibility', verifyToken, gamesController.checkGameCompatibility);

module.exports = router;