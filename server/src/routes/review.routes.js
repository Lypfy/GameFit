const express = require('express');
const router = express.Router();

const reviewController = require('../controller/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/:game_id', verifyToken, reviewController.writeReview);
router.put('/:game_id', verifyToken, reviewController.updateReview);
router.delete('/:game_id', verifyToken, reviewController.deleteReview);
router.get('/:game_id', reviewController.getReviews);
router.get('/avg/:game_id', reviewController.getAvgRating);
router.post('/recommendation/:game_id', verifyToken, reviewController.writeReviewPcCompatibility);

router.get('/recommendation/:game_id', reviewController.getReviewPcCompatibility);
router.delete('/recommendation/:recommendation_id', verifyToken, reviewController.deleteReviewPcCompatibility);

module.exports = router;
