const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller')

router.get('/', gamesController.getGames);
router.get('/:game_id', gamesController.getGameDetail);

module.exports = router;