/**
 * GameFit Engine - Thuật toán so khớp tương thích cấu hình PC và yêu cầu Game
 */

/**
 * Kiểm tra xem PC của người dùng có thể chạy được game hay không
 * @param {Object} userPc - Cấu hình PC của người dùng { cpuScore, gpuScore, ramGb, storageGb }
 * @param {Object} gameReq - Yêu cầu cấu hình game { minimum, recommended }
 * @returns {Object} Kết quả đánh giá: status ('CANNOT_RUN' | 'MINIMUM' | 'RECOMMENDED' | 'MAX_SETTINGS')
 */
const evaluateCompatibility = (userPc, gameReq) => {
  const { minimum, recommended } = gameReq;

  // 1. Kiểm tra cấu hình tối thiểu
  const meetsMinCpu = userPc.cpuScore >= (minimum?.cpuScore || 0);
  const meetsMinGpu = userPc.gpuScore >= (minimum?.gpuScore || 0);
  const meetsMinRam = userPc.ramGb >= (minimum?.ramGb || 0);
  const meetsMinStorage = userPc.storageGb >= (minimum?.storageGb || 0);

  if (!meetsMinCpu || !meetsMinGpu || !meetsMinRam || !meetsMinStorage) {
    const bottlenecks = [];
    if (!meetsMinCpu) bottlenecks.push("CPU");
    if (!meetsMinGpu) bottlenecks.push("GPU");
    if (!meetsMinRam) bottlenecks.push("RAM");
    if (!meetsMinStorage) bottlenecks.push("Dung lượng ổ cứng");

    return {
      status: "CANNOT_RUN",
      tier: 0,
      label: "Không đủ cấu hình",
      color: "red",
      bottlenecks,
      recommendation: `Cần nâng cấp: ${bottlenecks.join(", ")} để trải nghiệm tựa game này.`,
    };
  }

  // 2. Kiểm tra cấu hình đề nghị
  const meetsRecCpu = userPc.cpuScore >= (recommended?.cpuScore || 0);
  const meetsRecGpu = userPc.gpuScore >= (recommended?.gpuScore || 0);
  const meetsRecRam = userPc.ramGb >= (recommended?.ramGb || 0);

  if (meetsRecCpu && meetsRecGpu && meetsRecRam) {
    return {
      status: "RECOMMENDED",
      tier: 2,
      label: "Chơi mượt mà (60+ FPS)",
      color: "green",
      bottlenecks: [],
      recommendation: "Cấu hình của bạn đáp ứng hoàn hảo cho thiết lập đồ họa cao!",
    };
  }

  // 3. Đạt mức tối thiểu
  return {
    status: "MINIMUM",
    tier: 1,
    label: "Chơi được (Mức tối thiểu ~30 FPS)",
    color: "yellow",
    bottlenecks: [],
    recommendation: "Có thể chơi ở thiết lập đồ họa thấp đến trung bình.",
  };
};

module.exports = {
  evaluateCompatibility,
};
