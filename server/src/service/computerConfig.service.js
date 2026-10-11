const { sql } = require('../config/db');

const getComputerConfig = async (user_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', user_id);
        const result = await request.query('SELECT * FROM dbo.fn_getComputersConfig(@user_id)');
        return result.recordset;
    }
    catch (error) {
        console.error('Error in getComputerConfig Service:', error.message);
        throw new Error('Lỗi khi lấy danh sách cấu hình máy tính người dùng');
    }
};

async function resolveCpuGpuIds(cpu_id, gpu_id) {
  let resolvedCpuId = parseInt(cpu_id, 10);
  let resolvedGpuId = parseInt(gpu_id, 10);

  if (isNaN(resolvedCpuId) || !resolvedCpuId) {
    if (typeof cpu_id === "string" && cpu_id.trim()) {
      try {
        const reqCpu = new sql.Request();
        reqCpu.input("name", sql.NVarChar(100), cpu_id.trim());
        const resCpu = await reqCpu.query("SELECT TOP 1 cpu_id FROM CPUs WHERE name LIKE '%' + @name + '%' OR brand LIKE '%' + @name + '%'");
        if (resCpu.recordset?.[0]?.cpu_id) {
          resolvedCpuId = resCpu.recordset[0].cpu_id;
        }
      } catch (err) {
        console.warn("Could not resolve cpu_id from name:", err.message);
      }
    }
  }

  if (isNaN(resolvedGpuId) || !resolvedGpuId) {
    if (typeof gpu_id === "string" && gpu_id.trim()) {
      try {
        const reqGpu = new sql.Request();
        reqGpu.input("name", sql.NVarChar(100), gpu_id.trim());
        const resGpu = await reqGpu.query("SELECT TOP 1 gpu_id FROM GPUs WHERE name LIKE '%' + @name + '%' OR brand LIKE '%' + @name + '%'");
        if (resGpu.recordset?.[0]?.gpu_id) {
          resolvedGpuId = resGpu.recordset[0].gpu_id;
        }
      } catch (err) {
        console.warn("Could not resolve gpu_id from name:", err.message);
      }
    }
  }

  return {
    cpuId: isNaN(resolvedCpuId) || !resolvedCpuId ? null : resolvedCpuId,
    gpuId: isNaN(resolvedGpuId) || !resolvedGpuId ? null : resolvedGpuId,
  };
}

const addComputerConfig = async (pc_name, user_id, cpu_id, gpu_id, os, ram, storage) => {
    try {
        const { cpuId, gpuId } = await resolveCpuGpuIds(cpu_id, gpu_id);

        const request = new sql.Request();
        request.input('pc_name', pc_name);
        request.input('user_id', user_id);
        request.input('cpu_id', cpuId);
        request.input('gpu_id', gpuId);
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
        const { cpuId, gpuId } = await resolveCpuGpuIds(cpu_id, gpu_id);

        const request = new sql.Request();
        request.input('pc_id', pc_id);
        request.input('pc_name', pc_name);
        request.input('user_id', user_id);
        request.input('cpu_id', cpuId);
        request.input('gpu_id', gpuId);
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
