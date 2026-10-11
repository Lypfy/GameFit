-- Viết đánh gía 
CREATE OR ALTER PROCEDURE sp_WriteReview
    @user_id INT,
    @game_id INT,
    @rating INT,
    @comment NVARCHAR(MAX)
AS
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM vw_Game_Detail
        WHERE game_id = @game_id
    )
    BEGIN
        RAISERROR(N'Game không tồn tại trong hệ thống', 16, 1)
        RETURN
    END

    IF NOT EXISTS (
        SELECT 1 
        FROM vw_User_Safe_Profile
        WHERE user_id = @user_id
    )
    BEGIN
        RAISERROR(N'Người dùng không tồn tại trong hệ thống', 16, 1)
        RETURN 
    END

    IF (@rating < 1 OR @rating > 5)
    BEGIN
        RAISERROR(N'Điểm đánh giá không được bé hơn 1 và không được lớn hơn 5', 16, 1)
        RETURN
    END

    IF EXISTS (
        SELECT 1
        FROM Reviews
        WHERE user_id = @user_id AND game_id = @game_id
    )
    BEGIN
        RAISERROR(N'Bạn đã viết đánh giá game này rồi', 16, 1)
        RETURN 
    END

    INSERT INTO Reviews(user_id, game_id, rating, comment)
    VALUES(@user_id, @game_id, @rating, @comment)
END 
GO 

-- Cập nhật đánh giá 
CREATE OR ALTER PROCEDURE sp_UpdateReview(@user_id INT, @game_id INT, @rating INT, @comment NVARCHAR(MAX)) 
AS
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM vw_Game_Detail
        WHERE game_id = @game_id
    )
    BEGIN
        RAISERROR(N'Game không tồn tại trong hệ thống', 16, 1)
        RETURN
    END

    IF NOT EXISTS (
        SELECT 1 
        FROM vw_User_Safe_Profile
        WHERE user_id = @user_id
    )
    BEGIN
        RAISERROR(N'Người dùng không tồn tại trong hệ thống', 16, 1)
        RETURN 
    END

    IF (@rating < 1 OR @rating > 5)
    BEGIN
        RAISERROR(N'Điểm đánh giá không được bé hơn 1 và không được lớn hơn 5', 16, 1)
        RETURN
    END

    IF NOT EXISTS (
        SELECT 1 
        FROM Reviews 
        WHERE user_id = @user_id AND game_id = @game_id
    )
    BEGIN
        RAISERROR(N'Bạn chưa có đánh giá nào cho game này để cập nhật', 16, 1)
        RETURN 
    END

    UPDATE Reviews
    SET rating = @rating, comment = @comment
    WHERE user_id = @user_id AND game_id = @game_id
END
GO 

-- Xóa 
CREATE OR ALTER PROCEDURE sp_DeleteReview
    @user_id INT,
    @game_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM Reviews
    WHERE user_id = @user_id AND game_id = @game_id;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetReportedReviews
    @status VARCHAR(20) = NULL,       -- 'PENDING', 'DISMISSED', 'HIDDEN' hoặc NULL / 'ALL' (lấy tất cả)
    @time_range VARCHAR(20) = 'all',  -- 'all', 'today', 'week', 'month'
    @search NVARCHAR(100) = NULL      -- Tìm theo tên người vi phạm hoặc lý do
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.review_id,
        u.user_name AS violator_name,
        r.comment,
        r.rating,
        r.report_count,
        r.report_reason,
        r.reported_at,
        r.report_status,
        g.name AS game_name
    FROM dbo.Reviews r
    JOIN dbo.Users u ON r.user_id = u.user_id
    JOIN dbo.Games g ON r.game_id = g.game_id
    WHERE r.report_count > 0
      -- Lọc theo trạng thái
      AND (@status IS NULL OR @status = 'ALL' OR r.report_status = @status)
      -- Lọc theo khoảng thời gian
      AND (
          @time_range = 'all' OR @time_range IS NULL
          OR (@time_range = 'today' AND CAST(r.reported_at AS DATE) = CAST(GETDATE() AS DATE))
          OR (@time_range = 'week'  AND r.reported_at >= DATEADD(DAY, -7, GETDATE()))
          OR (@time_range = 'month' AND r.reported_at >= DATEADD(MONTH, -1, GETDATE()))
      )
      -- Lọc tìm kiếm theo tên user, tên game, lý do báo cáo, nội dung hoặc chữ hiển thị trên cột Lý do
      AND (
          @search IS NULL OR LTRIM(RTRIM(@search)) = ''
          OR u.user_name LIKE N'%' + LTRIM(RTRIM(@search)) + N'%'
          OR g.name LIKE N'%' + LTRIM(RTRIM(@search)) + N'%'
          OR r.report_reason LIKE N'%' + LTRIM(RTRIM(@search)) + N'%'
          OR r.comment LIKE N'%' + LTRIM(RTRIM(@search)) + N'%'
          OR (
              CASE 
                  WHEN r.report_reason LIKE N'% | %' THEN N'Nhiều lý do'
                  WHEN r.report_reason LIKE N'Lý do khác%' THEN N'Lý do khác'
                  ELSE r.report_reason
              END
          ) LIKE N'%' + LTRIM(RTRIM(@search)) + N'%'
      )
    ORDER BY 
        CASE WHEN r.report_status = 'PENDING' THEN 0 ELSE 1 END, -- Ưu tiên 'Chờ xử lý' lên đầu
        r.report_count DESC,
        r.reported_at DESC;
END;
GO

-- Báo cáo đánh giá vi phạm 
CREATE OR ALTER PROCEDURE sp_ReportReview
    @review_id INT,
    @report_reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra sự tồn tại của Review
    IF NOT EXISTS (SELECT 1 FROM dbo.Reviews WHERE review_id = @review_id)
    BEGIN
        RAISERROR(N'Đánh giá không tồn tại', 16, 1);
        RETURN;
    END

    -- Cập nhật: tăng count, chuyển sang PENDING và nối thêm lý do mới nếu chưa có
    UPDATE dbo.Reviews
    SET 
        report_count = report_count + 1,
        report_status = 'PENDING',
        report_reason = CASE 
            -- Nếu chưa có lý do nào trước đó
            WHEN report_reason IS NULL OR LTRIM(RTRIM(report_reason)) = '' 
                THEN @report_reason
            
            -- Nếu lý do này đã tồn tại trong chuỗi rồi -> Giữ nguyên, không ghi trùng
            WHEN CHARINDEX(@report_reason, report_reason) > 0 
                THEN report_reason
            
            -- Nếu là lý do mới -> Nối thêm vào sau dấu phân cách " | "
            ELSE report_reason + N' | ' + @report_reason
        END,
        reported_at = GETDATE()
    WHERE review_id = @review_id;
END;
GO 

CREATE OR ALTER PROCEDURE sp_ModerateReview
    @review_id INT,
    @action VARCHAR(20) -- 'HIDE' (Ẩn đánh giá) hoặc 'DISMISS' (Bỏ qua báo cáo)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra sự tồn tại của Review
    IF NOT EXISTS (SELECT 1 FROM dbo.Reviews WHERE review_id = @review_id)
    BEGIN
        RAISERROR(N'Đánh giá không tồn tại', 16, 1);
        RETURN;
    END

    IF @action = 'HIDE'
    BEGIN
        -- Xác nhận vi phạm: Ẩn đánh giá khỏi người dùng và cập nhật trạng thái
        UPDATE dbo.Reviews
        SET 
            is_hidden = 1,
            report_status = 'HIDDEN'
        WHERE review_id = @review_id;
    END
    ELSE IF @action = 'DISMISS'
    BEGIN
        -- Báo cáo sai: Mở lại hiển thị bình luận và chuyển sang trạng thái Đã bỏ qua
        UPDATE dbo.Reviews
        SET 
            is_hidden = 0,
            report_status = 'DISMISSED'
        WHERE review_id = @review_id;
    END
    ELSE
    BEGIN
        RAISERROR(N'Hành động không hợp lệ (chỉ chấp nhận HIDE hoặc DISMISS)', 16, 1);
        RETURN;
    END
END;
GO



