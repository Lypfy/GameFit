const express = require('express');
const router = express.Router();

const reviewController = require('../controller/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/vote', verifyToken, reviewController.vote);
router.post('/report/:review_id', verifyToken, reviewController.reportReview);
router.get('/admin/reports', verifyToken, reviewController.getReportedReviews);
router.post('/admin/moderate/:review_id', verifyToken, reviewController.moderateReview);

router.post('/:game_id', verifyToken, reviewController.writeReview);
router.put('/:game_id', verifyToken, reviewController.updateReview);
router.delete('/:game_id', verifyToken, reviewController.deleteReview);
router.get('/:game_id', reviewController.getReviews);
router.get('/avg/:game_id', reviewController.getAvgRating);
router.post('/recommendation/:game_id', verifyToken, reviewController.createGamePCRecommendation);

router.get('/recommendation/:game_id', reviewController.getGamePCRecommendations);
router.delete('/recommendation/:recommendation_id', verifyToken, reviewController.deleteGamePCRecommendation);

module.exports = router;
