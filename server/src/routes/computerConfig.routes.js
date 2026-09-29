const express = require('express');
const router = express.Router();
const computerConfigController = require('../controller/computerConfig.controller');
const { verifyToken } = require('../middleware/auth.middleware');
// Lấy danh sách cấu hình máy tính của user (yêu cầu user_id trên URL)
router.get('/', verifyToken, computerConfigController.getComputerConfig);

// Thêm cấu hình máy tính mới (dữ liệu nằm trong req.body)
router.post('/', verifyToken, computerConfigController.addComputerConfig);

// Cập nhật cấu hình máy tính (dữ liệu và pc_id nằm trong req.body)
router.put('/', verifyToken, computerConfigController.updateComputerConfig);

// Xóa cấu hình máy tính (pc_id và user_id nằm trong req.body)
router.delete('/', verifyToken, computerConfigController.deleteComputerConfig);

module.exports = router;
