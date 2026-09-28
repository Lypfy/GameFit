const express = require('express');
const router = express.Router();

const reviewController = require('../controller/review.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/:game_id', verifyToken, reviewController.writeReview);


module.exports = router;
