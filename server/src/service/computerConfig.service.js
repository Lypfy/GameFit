const { sql } = require('../config/db');

const getComputerConfig = async (user_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', user_id);
        const result = await request.query('SELECT pc_name, cpu_id, gpu_id, ram, storage, os FROM dbo.getComputerConfig(@user_id)');
        return result.recordset;
    }
    catch (error) {
        console.error('Error in getComputerConfig Service:', error.message);
        throw new Error('Lỗi khi lấy danh sách cấu hình máy tính người dùng');
    }
};

const addComputerConfig = async (pc_name, user_id, cpu_id, gpu_id, os, ram, storage) => {
    try {
        const request = new sql.Request();
        request.input('pc_name', pc_name);
        request.input('user_id', user_id);
        request.input('cpu_id', cpu_id);
        request.input('gpu_id', gpu_id);
        request.input('os', os);
        request.input('ram', ram);
        request.input('storage', storage);

        const result = await request.execute('sp_addComputerConfig');

        if (result.rowsAffected && result.rowsAffected[0] === 0) {
            return null;
        }

        return result.recordset?.[0];
    }
    catch (error) {
        console.error('Error in addComputerConfig Service:', error.message);
        throw new Error('Lỗi khi thêm cấu hình máy tính cho người dùng');
    }
};

const updateComputerConfig = async (pc_id, pc_name, user_id, cpu_id, gpu_id, os, ram, storage) => {
    try {
        const request = new sql.Request();
        request.input('pc_id', pc_id);
        request.input('pc_name', pc_name);
        request.input('user_id', user_id);
        request.input('cpu_id', cpu_id);
        request.input('gpu_id', gpu_id);
        request.input('os', os);
        request.input('ram', ram);
        request.input('storage', storage);

        const result = await request.execute('sp_UpdateComputerConfig');
        return result.rowsAffected?.[0] > 0;
    }
    catch (error) {
        console.log('Error in updateComputerConfig Service', error.message);
        throw new Error('Lỗi khi cập nhật cấu hình máy tính người dùng');
    }
}

const deleteComputerConfig = async (pc_id, user_id) => {
    try {
        const request = new sql.Request();
        request.input('pc_id', pc_id);
        request.input('user_id', user_id);

        const result = await request.execute('sp_DeleteComputerConfig');
        return result.rowsAffected?.[0] > 0;
    }
    catch (error) {
        console.log('Error in deleteComputerConfig', error.message);
        throw new Error('Lỗi khi xóa cấu hình máy tính của người dùng');
    }
}

module.exports = {
    getComputerConfig,
    addComputerConfig,
    updateComputerConfig,
    deleteComputerConfig
};
