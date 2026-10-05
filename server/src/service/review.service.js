const { sql } = require('../config/db')

const writeReview = async (user_id, game_id, rating, comment) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);
        request.input('rating', sql.Int, rating);
        request.input('comment', sql.NVarChar, comment);

        const result = await request.execute('sp_WriteReview');
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.log('Error in writeReview Service: ', error.message);
        throw new Error(error.message);
    }
}

const updateReview = async (user_id, game_id, rating, comment) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);
        request.input('rating', sql.Int, rating);
        request.input('comment', sql.NVarChar, comment);

        const result = await request.execute('sp_UpdateReview');
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.log('Error in updateReview Service: ', error.message);
        throw new Error(error.message);
    }
}

const getReview = async (game_id) => {
    try {
        const request = new sql.Request();
        request.input('game_id', sql.Int, game_id);

        const result = await request.query('SELECT * FROM fn_getReviews(@game_id)');
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.log('Error in updateReview Service: ', error.message);
        throw new Error(error.message);
    }
}

const getAvgRating = async (game_id) => {
    try {
        const request = new sql.Request();
        request.input('game_id', sql.Int, game_id);
        const result = await request.query('SELECT fn_GetAverageRating(@game_id)');
        return { success: true, data: result };
    }
    catch (error) {
        console.log('Error in getAvgRating Service: ', error.message);
        throw new Error(error.message);
    }
}
const deleteReview = async (user_id, game_id) => {
    try {
        const request = new sql.Request();
        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);

        const result = await request.execute('sp_DeleteReview');
        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.log('Error in deleteReview Service: ', error.message);
        throw new Error(error.message);
    }
}

const writeReviewPcCompatibility = async (user_id, game_id, pc_id, type, note) => {
    try {
        const request = new sql.Request();

        request.input('user_id', sql.Int, user_id);
        request.input('game_id', sql.Int, game_id);
        request.input('pc_id', sql.Int, pc_id);
        request.input('type', sql.VarChar, type);

        if (note) {
            request.input('note', sql.NVarChar, note);
        } else {
            request.input('note', sql.NVarChar, null);
        }

        const result = await request.execute('sp_WriteReviewPcCompatibility');

        return { success: true, message: 'Đã đính kèm cấu hình đề xuất thành công!' };
    }
    catch (error) {
        console.log('Error in writeReviewPcCompatibility Service: ', error.message);
        throw new Error(error.message);
    }
}

const getReviewPcCompatibility = async (game_id) => {
    try {
        const request = new sql.Request();
        request.input('game_id', sql.Int, game_id);

        const result = await request.execute('sp_GetReviewPcCompatibility');

        return { success: true, data: result.recordset };
    }
    catch (error) {
        console.log('Error in getReviewPcCompatibility Service: ', error.message);
        throw new Error(error.message);
    }
}

const deleteReviewPcCompatibility = async (user_id, recommendation_id) => {
    try {
        const request = new sql.Request();

        request.input('user_id', sql.Int, user_id);
        request.input('recommendation_id', sql.Int, recommendation_id);

        // Gọi Procedure thực hiện lệnh UPDATE ẩn bài (Soft Delete)
        const result = await request.execute('sp_DeleteReviewPcCompatibility');

        // Nếu rowsAffected[0] === 0 nghĩa là không tìm thấy bài nào khớp id hoặc user đó không phải chủ bài
        if (result.rowsAffected[0] === 0) {
            return { success: false, message: 'Không tìm thấy đề xuất hoặc bạn không có quyền xóa' };
        }

        return { success: true, message: 'Đã ẩn đề xuất cấu hình thành công' };
    }
    catch (error) {
        console.log('Error in deleteReviewPcCompatibility Service: ', error.message);
        throw new Error(error.message);
    }
}


module.exports = {
    writeReview,
    updateReview,
    deleteReview,
    getReview,
    getAvgRating,
    writeReviewPcCompatibility,
    getReviewPcCompatibility,
    deleteReviewPcCompatibility
}