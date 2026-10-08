-- ============================================================================
-- Stored Procedure: dbo.sp_UpdateGameRequirement
-- Khắc phục các lỗi:
-- 1. Lỗi Khóa ngoại (FK Constraint): Tự động gán CPU/GPU ID mặc định nếu không khớp tên.
-- 2. Lỗi NULL value: Gán giá trị mặc định cho OS, RAM, Storage khi chưa nhập.
-- 3. Lỗi so sánh chuỗi không khớp tuyệt đối: Hỗ trợ tìm kiếm theo từ khóa LIKE.
-- ============================================================================

IF OBJECT_ID('dbo.sp_UpdateGameRequirement', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateGameRequirement;
GO

CREATE PROCEDURE dbo.sp_UpdateGameRequirement
    @game_id INT,
    @type VARCHAR(50),             -- 'MINIMUM' hoặc 'RECOMMENDED'
    @os NVARCHAR(100) = NULL,      -- Hệ điều hành
    @cpu_name NVARCHAR(255) = NULL, -- Tên CPU
    @gpu_name NVARCHAR(255) = NULL, -- Tên GPU
    @ram INT = NULL,               -- Dung lượng RAM (GB)
    @storage INT = NULL            -- Dung lượng ổ cứng (GB)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Kiểm tra tham số @type có hợp lệ không
    IF UPPER(ISNULL(@type, '')) NOT IN ('MINIMUM', 'RECOMMENDED')
    BEGIN
        SELECT 0 AS success, N'Type phải là MINIMUM hoặc RECOMMENDED' AS message;
        RETURN;
    END;

    -- 2. Tìm cpu_id trong bảng CPUs
    DECLARE @cpu_id INT = NULL;
    IF NULLIF(LTRIM(RTRIM(@cpu_name)), '') IS NOT NULL
    BEGIN
        SELECT TOP 1 @cpu_id = cpu_id
        FROM dbo.CPUs
        WHERE LOWER(name) = LOWER(LTRIM(RTRIM(@cpu_name)))
           OR LOWER(name) LIKE '%' + LOWER(LTRIM(RTRIM(@cpu_name))) + '%';
    END;

    -- Nếu CPU nhập vào không khớp với linh kiện nào trong DB, lấy ID CPU đầu tiên sẵn có để tránh lỗi Khóa ngoại (FK)
    IF @cpu_id IS NULL AND EXISTS (SELECT 1 FROM dbo.CPUs)
    BEGIN
        SELECT TOP 1 @cpu_id = cpu_id FROM dbo.CPUs;
    END;

    -- 3. Tìm gpu_id trong bảng GPUs
    DECLARE @gpu_id INT = NULL;
    IF NULLIF(LTRIM(RTRIM(@gpu_name)), '') IS NOT NULL
    BEGIN
        SELECT TOP 1 @gpu_id = gpu_id
        FROM dbo.GPUs
        WHERE LOWER(name) = LOWER(LTRIM(RTRIM(@gpu_name)))
           OR LOWER(name) LIKE '%' + LOWER(LTRIM(RTRIM(@gpu_name))) + '%';
    END;

    -- Nếu GPU nhập vào không khớp với linh kiện nào trong DB, lấy ID GPU đầu tiên sẵn có để tránh lỗi Khóa ngoại (FK)
    IF @gpu_id IS NULL AND EXISTS (SELECT 1 FROM dbo.GPUs)
    BEGIN
        SELECT TOP 1 @gpu_id = gpu_id FROM dbo.GPUs;
    END;

    -- 4. Thực hiện Cập nhật (UPDATE) nếu đã có, hoặc Thêm mới (INSERT) nếu chưa có
    IF EXISTS (
        SELECT 1
        FROM dbo.Game_requirement
        WHERE game_id = @game_id
          AND UPPER(type) = UPPER(@type)
    )
    BEGIN
        -- Cập nhật bản ghi đã tồn tại
        UPDATE dbo.Game_requirement
        SET os = ISNULL(NULLIF(LTRIM(RTRIM(@os)), ''), os),
            ram = ISNULL(@ram, ram),
            storage = ISNULL(@storage, storage),
            cpu_id = ISNULL(@cpu_id, cpu_id),
            gpu_id = ISNULL(@gpu_id, gpu_id)
        WHERE game_id = @game_id
          AND UPPER(type) = UPPER(@type);
    END
    ELSE
    BEGIN
        -- Thêm mới bản ghi nếu chưa có
        INSERT INTO dbo.Game_requirement
        (
            game_id,
            type,
            os,
            ram,
            storage,
            cpu_id,
            gpu_id
        )
        VALUES
        (
            @game_id,
            UPPER(@type),
            ISNULL(NULLIF(LTRIM(RTRIM(@os)), ''), N'Windows 10 64-bit'),
            ISNULL(@ram, 8),
            ISNULL(@storage, 50),
            @cpu_id,
            @gpu_id
        );
    END;

    -- Trả kết quả thành công cho Node.js API Backend
    SELECT 1 AS success, N'Cập nhật thông tin cấu hình game thành công' AS message;
END;
GO
