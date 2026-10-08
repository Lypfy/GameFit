const express = require('express');
const router = express.Router();
const gamesController = require('../controller/games.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { cacheMiddleware, clearGamesCache } = require('../middleware/cache.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình Multer lưu ảnh vào client/assets/uploads/games
const uploadDir = path.join(__dirname, '../../../client/assets/uploads/games');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeName}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
        }
    }
});

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

// Route upload ảnh cho game
router.post('/upload-images', upload.array('images', 20), gamesController.uploadImages);

// Các API thay đổi dữ liệu sẽ tự động dọn dẹp Cache
router.post('/add', clearGamesCache, gamesController.addGame);
router.post('/update', clearGamesCache, gamesController.updateGame);
router.post('/update-requirement', clearGamesCache, gamesController.updateGameRequirement);
router.post('/delete', clearGamesCache, gamesController.deleteGame);

module.exports = router;