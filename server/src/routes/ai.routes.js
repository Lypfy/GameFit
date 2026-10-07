const express = require('express');
const router = express.Router();
const aiController = require('../controller/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// API gọi AI tư vấn nâng cấp PC (cần đăng nhập)
router.post('/advise', verifyToken, aiController.adviseUpgrade);

// API gọi AI tóm tắt đánh giá
router.post('/summarize-reviews', aiController.summarizeReviews);

// API Chatbot hướng dẫn người dùng
router.post('/chat', aiController.chatWithAI);

module.exports = router;
