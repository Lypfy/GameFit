const reviewService = require('../service/review.service')

const writeReview = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;
        const { rating, comment } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.writeReview(user_id, game_id, rating, comment);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Viết review thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Viết review thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in writeReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi viết review'
        });
    }
}

const updateReview = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;
        const { rating, comment } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.updateReview(user_id, game_id, rating, comment);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Cập nhật review thất bại' });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật review thành công' });
    }
    catch (error) {
        console.log('Error in updateReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật review'
        });
    }
}

const getReviews = async (req, res) => {
    try {
        const { game_id } = req.params;
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.getReview(game_id);
        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin review thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in getReviews Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin review'
        });
    }
}

const getAvgRating = async (req, res) => {
    try {
        const { game_id } = req.params;
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.getAvgRating(game_id);
        if (!result) {
            return res.status(400).json({ success: false, message: 'Tính điểm trung bình review của game thất bại' });
        }

        return res.status(200).json({
            success: true,
            message: 'Tính điểm trung bình review của game thành công',
            data: result.data
        })
    }
    catch (error) {
        console.log('Error in getAvgRating Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi tính điểm trung bình review của game'
        });
    }
}

const deleteReview = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }

        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.deleteReview(user_id, game_id);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Xóa review thất bại' });
        }

        return res.status(200).json({ success: true, message: 'Xóa review thành công' });
    }
    catch (error) {
        console.log('Error in deleteReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa review'
        });
    }
}

const createGamePCRecommendation = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { game_id } = req.params;
        const { pc_id, type, note } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }
        if (!pc_id || !type) {
            return res.status(400).json({ success: false, message: 'Thiếu pc_id hoặc type hợp lệ' });
        }

        const result = await reviewService.createGamePCRecommendation(user_id, game_id, pc_id, type, note);
        if (!result.success) {
            return res.status(400).json({ success: false, message: 'Đề xuất cấu hình thất bại' });
        }

        return res.status(200).json({ success: true, message: 'Đề xuất cấu hình thành công' });
    }
    catch (error) {
        console.log('Error in createGamePCRecommendation Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi đề xuất cấu hình'
        });
    }
}

const getGamePCRecommendations = async (req, res) => {
    try {
        const { game_id } = req.params;
        if (!game_id) {
            return res.status(400).json({ success: false, message: 'Thiếu game_id hợp lệ' });
        }

        const result = await reviewService.getGamePCRecommendations(game_id);
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đề xuất cấu hình thành công',
            data: result.data
        });
    } catch (error) {
        console.log('Error in getGamePCRecommendations Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách đề xuất cấu hình'
        });
    }
}

const deleteGamePCRecommendation = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { recommendation_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        }
        if (!recommendation_id) {
            return res.status(400).json({ success: false, message: 'Thiếu recommendation_id hợp lệ' });
        }

        const result = await reviewService.deleteGamePCRecommendation(user_id, recommendation_id);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, message: result.message });
    }
    catch (error) {
        console.log('Error in deleteGamePCRecommendation Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa đề xuất cấu hình'
        });
    }
}

const vote = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { target_type, target_id, vote_type } = req.body;

        if (!user_id) return res.status(400).json({ success: false, message: 'Thiếu user_id hợp lệ' });
        if (!target_type || !target_id || !vote_type) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số vote hợp lệ' });
        }

        const result = await reviewService.vote(user_id, target_type, target_id, vote_type);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Error in vote Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi vote'
        });
    }
}

const reportReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { report_reason } = req.body;

        if (!review_id) {
            return res.status(400).json({ success: false, message: 'Thiếu review_id hợp lệ' });
        }
        if (!report_reason) {
            return res.status(400).json({ success: false, message: 'Thiếu lý do báo cáo' });
        }

        const result = await reviewService.reportReview(review_id, report_reason);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Error in reportReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi báo cáo đánh giá'
        });
    }
}

const getReportedReviews = async (req, res) => {
    try {
        const { status, time_range, search } = req.query;
        const result = await reviewService.getReportedReviews(status, time_range, search);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Error in getReportedReviews Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách báo cáo vi phạm'
        });
    }
}

const moderateReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { action } = req.body;

        if (!review_id) {
            return res.status(400).json({ success: false, message: 'Thiếu review_id hợp lệ' });
        }
        if (!action || !['HIDE', 'DISMISS'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Hành động không hợp lệ (chỉ chấp nhận HIDE hoặc DISMISS)' });
        }

        const result = await reviewService.moderateReview(review_id, action);
        return res.status(200).json(result);
    } catch (error) {
        console.log('Error in moderateReview Controller: ', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi server khi kiểm duyệt đánh giá'
        });
    }
}

module.exports = {
    writeReview,
    updateReview,
    deleteReview,
    getReviews,
    getAvgRating,
    createGamePCRecommendation,
    getGamePCRecommendations,
    deleteGamePCRecommendation,
    vote,
    reportReview,
    getReportedReviews,
    moderateReview
}