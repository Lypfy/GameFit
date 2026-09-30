const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', gamesController.getGames);
router.get('/tag/:tag_id', gamesController.getGameByTag);
router.get('/:game_id/full_detail', gamesController.getFullGameDetail);
router.get('/:game_id/game_requirement', gamesController.getGameRequirement);
router.get('/:game_id/compatibility', verifyToken, gamesController.checkGameCompatibility);
router.post('/compatibility-percent', gamesController.getCompatibilityPercent);
router.post('/add', gamesController.addGame);
router.post('/update', gamesController.updateGame);
router.post('/delete', gamesController.deleteGame);

module.exports = router;