const express = require('express');
const router = express.Router();
const computerConfigController = require('../controller/computerConfig.controller');

// Lấy danh sách cấu hình máy tính của user (yêu cầu user_id trên URL)
router.get('/:user_id', computerConfigController.getComputerConfig);

// Thêm cấu hình máy tính mới (dữ liệu nằm trong req.body)
router.post('/', computerConfigController.addComputerConfig);

// Cập nhật cấu hình máy tính (dữ liệu và pc_id nằm trong req.body)
router.put('/', computerConfigController.updateComputerConfig);

// Xóa cấu hình máy tính (pc_id và user_id nằm trong req.body)
router.delete('/', computerConfigController.deleteComputerConfig);

module.exports = router;
