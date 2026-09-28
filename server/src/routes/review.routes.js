const express = require('express');
const router = express.Router();

const reviewController = require('../controller/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/:game_id', verifyToken, reviewController.writeReview);
router.put('/:game_id', verifyToken, reviewController.updateReview);
router.get('/:game_id', reviewController.getReviews);
router.get('/avg/:game_id', reviewController.getAvgRating);


module.exports = router;
