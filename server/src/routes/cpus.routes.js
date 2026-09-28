const express = require('express');
const router = express.Router();
const cpusController = require('../controller/cpus.controller');

// Lấy danh sách CPU (có phân trang & tìm kiếm)
router.get('/', cpusController.getCPUs);

// Lấy chi tiết 1 CPU theo ID
router.get('/:id', cpusController.getCPUById);

// Thêm CPU mới
router.post('/', cpusController.addCPU);

// Cập nhật CPU theo ID (hoặc trong body)
router.put('/:id', cpusController.updateCPU);
router.put('/', cpusController.updateCPU);

// Xóa CPU theo ID (hoặc trong body)
router.delete('/:id', cpusController.deleteCPU);
router.delete('/', cpusController.deleteCPU);

module.exports = router;
