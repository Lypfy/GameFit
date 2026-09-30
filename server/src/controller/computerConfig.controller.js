const computerConfigService = require('../service/computerConfig.service');

const getComputerConfig = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        const result = await computerConfigService.getComputerConfig(user_id);

        return res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getComputerConfig Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy cấu hình máy tính của người dùng' });
    }
};

const addComputerConfig = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { pc_name, cpu_id, gpu_id, os, ram, storage } = req.body;

        // Danh sách các trường bắt buộc
        const requiredFields = ['pc_name', 'cpu_id', 'gpu_id', 'ram', 'storage'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ success: false, message: `Thiếu ${field} hợp lệ` });
            }
        }

        const result = await computerConfigService.addComputerConfig(pc_name, user_id, cpu_id, gpu_id, os, ram, storage);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Thêm cấu hình máy tính thất bại' });
        }

        return res.status(200).json({ success: true, message: 'Thêm cấu hình máy tính thành công' });
    }
    catch (error) {
        console.log('Error in addComputerConfig Controller', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi thêm cấu hình máy tính của người dùng' });
    }
}

const updateComputerConfig = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { pc_id, pc_name, cpu_id, gpu_id, os, ram, storage } = req.body;

        const requiredFields = ['pc_id', 'pc_name', 'cpu_id', 'gpu_id', 'ram', 'storage'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ success: false, message: `Thiếu ${field} hợp lệ` })
            }
        }

        const result = await computerConfigService.updateComputerConfig(pc_id, pc_name, user_id, cpu_id, gpu_id, os, ram, storage);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Cập nhật cấu hình máy tính người dùng không thành công' });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật cấu hình máy tính người dùng thành công' });
    }
    catch (error) {
        console.log('Error in updateComputerConfig Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật cấu hình máy tính của người dùng' });
    }
}

const deleteComputerConfig = async (req, res) => {
    try {
        const { pc_id } = req.body
        const user_id = req.user.user_id;

        if (!pc_id) {
            return res.status(400).json({ success: false, message: 'Thiếu pc_id hợp lệ' });
        }

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        const result = await computerConfigService.deleteComputerConfig(pc_id, user_id);

        if (!result) {
            return res.status(400).json({ success: false, message: 'Xóa cấu hình máy tính người dùng thất bại' });
        }
        return res.status(200).json({ success: true, message: 'Xóa dữ liệu cấu hình máy tính người dùng thành công' });
    }
    catch (error) {
        console.log('Error in deleteComputerConfig Controller:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa cấu hình máy tính của người dùng' });
    }
}


module.exports = {
    getComputerConfig,
    addComputerConfig,
    updateComputerConfig,
    deleteComputerConfig
};