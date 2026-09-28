const express = require('express');
const router = express.Router();
const gpusController = require('../controller/gpus.controller');

// Lấy danh sách GPU (có phân trang & tìm kiếm)
router.get('/', gpusController.getGPUs);

// Tìm kiếm GPU theo tên
router.get('/search', gpusController.searchGpuByName);

// Lấy chi tiết 1 GPU theo ID
router.get('/:id', gpusController.getGPUById);

// Thêm GPU mới
router.post('/', gpusController.addGPU);

// Cập nhật GPU theo ID (hoặc trong body)
router.put('/:id', gpusController.updateGPU);
router.put('/', gpusController.updateGPU);

// Xóa GPU theo ID (hoặc trong body)
router.delete('/:id', gpusController.deleteGPU);
router.delete('/', gpusController.deleteGPU);

module.exports = router;
