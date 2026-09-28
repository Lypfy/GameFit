const gpusService = require('../service/gpus.service');

const getGPUs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const result = await gpusService.getGPUs({ page, limit, search });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách GPU thành công',
            data: result.data || result,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error in getGPUs Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách GPU' });
    }
};

const getGPUById = async (req, res) => {
    try {
        const gpu_id = req.params.id || req.query.gpu_id;

        if (!gpu_id) {
            return res.status(400).json({ success: false, message: 'Thiếu gpu_id hợp lệ' });
        }

        const result = await gpusService.getGPUById(gpu_id);

        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy GPU' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin GPU thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in getGPUById Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin GPU' });
    }
};

const addGPU = async (req, res) => {
    try {
        const { gpu_name, brand, benchmark_score } = req.body;

        if (!gpu_name) {
            return res.status(400).json({ success: false, message: 'Thiếu gpu_name hợp lệ' });
        }

        const result = await gpusService.addGPU({ gpu_name, brand, benchmark_score });

        if (!result) {
            return res.status(400).json({ success: false, message: 'Thêm GPU thất bại' });
        }

        return res.status(201).json({
            success: true,
            message: 'Thêm GPU thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in addGPU Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi thêm GPU' });
    }
};

const updateGPU = async (req, res) => {
    try {
        const gpu_id = req.params.id || req.body.gpu_id;
        const { gpu_name, brand, benchmark_score } = req.body;

        if (!gpu_id) {
            return res.status(400).json({ success: false, message: 'Thiếu gpu_id hợp lệ' });
        }

        const result = await gpusService.updateGPU(gpu_id, { gpu_name, brand, benchmark_score });

        if (!result) {
            return res.status(400).json({ success: false, message: 'Cập nhật GPU thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Cập nhật GPU thành công'
        });
    } catch (error) {
        console.error('Error in updateGPU Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật GPU' });
    }
};

const deleteGPU = async (req, res) => {
    try {
        const gpu_id = req.params.id || req.body.gpu_id;

        if (!gpu_id) {
            return res.status(400).json({ success: false, message: 'Thiếu gpu_id hợp lệ' });
        }

        const result = await gpusService.deleteGPU(gpu_id);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Xóa GPU thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa GPU thành công'
        });
    } catch (error) {
        console.error('Error in deleteGPU Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa GPU' });
    }
};

module.exports = {
    getGPUs,
    getGPUById,
    addGPU,
    updateGPU,
    deleteGPU
};
