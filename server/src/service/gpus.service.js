const { sql } = require('../config/db');

const getGpus = async (gpu_id) => {
    try {
        const request = new sql.Request();
        request.input('gpu_id', gpu_id);
        const result = await request.query('SELECT gpu_id , name, brand, benchmark_score FROM dbo.fn_GetGpus(@gpu_id)');
        return result.recordset;
    }
    catch (error) {
        console.error('Error in getGpus Service:', error.message);
        throw new Error('Lỗi khi lấy danh sách gpu');
    }
};

const addGpu = async (gpu_id, name, brand, benchmark_score) => {
    try {
        const request = new sql.Request();
        request.input('gpu_id', gpu_id);
        request.input('name', name);
        request.input('brand', brand);
        request.input('benchmark_score', benchmark_score);

        const result = await request.execute('sp_addGpu');

        if (result.rowsAffected && result.rowsAffected[0] === 0) {
            return null;
        }

        return result.recordset?.[0];
    }
    catch (error) {
        console.error('Error in addGpu Service:', error.message);
        throw new Error('Lỗi khi thêm gpu');
    }
};

const updateGpu = async (gpu_id, name, brand, benchmark_score) => {
    try {
        const request = new sql.Request();
        request.input('gpu_id', gpu_id);
        request.input('name', name);
        request.input('brand', brand);
        request.input('benchmark_score', benchmark_score);

        const result = await request.execute('sp_updateGpu');
        return result.rowsAffected?.[0] > 0;
    }
    catch (error) {
        console.log('Error in updateGpu Service', error.message);
        throw new Error('Lỗi khi cập nhật gpu');
    }
}

const deleteGpu = async (gpu_id) => {
    try {
        const request = new sql.Request();
        request.input('gpu_id', gpu_id);

        const result = await request.execute('sp_deleteGpu');
        return result.rowsAffected?.[0] > 0;
    }
    catch (error) {
        console.log('Error in deleteGpu', error.message);
        throw new Error('Lỗi khi xóa gpu');
    }
}

module.exports = {
    getGpus,
    addGpu,
    updateGpu,
    deleteGpu
};
