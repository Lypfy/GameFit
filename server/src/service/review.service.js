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
module.exports = {
    writeReview,
    updateReview,
    getReview,
    getAvgRating
}