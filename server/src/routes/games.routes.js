const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { cacheMiddleware, clearGamesCache } = require('../middleware/cache.middleware');

// Cache trang home và danh sách game (14 ngày = 1209600 giây)
router.get('/', cacheMiddleware(1209600), gamesController.getGames);
router.get('/tag/:tag_id', cacheMiddleware(1209600), gamesController.getGameByTag);

router.get('/categories', gamesController.getCategories);
router.get('/publishers', gamesController.getPublishers);

// Cache chi tiết game (14 ngày)
router.get('/:game_id/full_detail', cacheMiddleware(1209600), gamesController.getFullGameDetail);
router.get('/:game_id/game_requirement', cacheMiddleware(1209600), gamesController.getGameRequirement);
router.get('/:game_id/compatibility', verifyToken, gamesController.checkGameCompatibility);
router.post('/compatibility-percent', gamesController.getCompatibilityPercent);

// Các API thay đổi dữ liệu sẽ tự động dọn dẹp Cache
router.post('/add', clearGamesCache, gamesController.addGame);
router.post('/update', clearGamesCache, gamesController.updateGame);
router.post('/delete', clearGamesCache, gamesController.deleteGame);

module.exports = router;