const { GoogleGenAI } = require('@google/genai');

const adviseUpgrade = async (req, res) => {
    try {
        const { gameSpecs, userSpecs } = req.body;

        if (!gameSpecs || !userSpecs) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin cấu hình' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Mock response if no API key
            return res.status(200).json({
                success: true,
                advice: "Tính năng AI chưa được cấu hình API Key. Tuy nhiên, hệ thống nhận thấy Card đồ họa hoặc CPU của bạn đang không đáp ứng đủ yêu cầu của game này."
            });
        }

        // Khởi tạo Gemini AI Client
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `Bạn là một chuyên gia phần cứng PC, tư vấn chuyên nghiệp cho GameFit.
Cấu hình Game yêu cầu: ${gameSpecs}.
Cấu hình máy khách: ${userSpecs}.
Bạn là AI tư vấn cấu hình máy tính cho GameFit.

Nhiệm vụ: Phân tích khả năng chạy game dựa trên:
- Cấu hình tối thiểu
- Cấu hình khuyến nghị
- Cấu hình hiện tại của người dùng

QUY TẮC:
1. Chỉ sử dụng dữ liệu được cung cấp, không tự bịa hoặc thay đổi thông tin.
2. Không tự suy đoán thông số CPU, GPU, RAM, VRAM, Storage hoặc OS.
3. Nếu GameFit đã cung cấp kết quả đạt/không đạt, ưu tiên kết quả đó.
4. Không đạt bất kỳ yêu cầu tối thiểu nào → "KHÔNG ĐẠT TỐI THIỂU".
5. Đạt tối thiểu nhưng chưa đạt khuyến nghị → "CÓ THỂ CHẠY NHƯNG CHƯA TỐI ƯU".
6. Đạt tất cả yêu cầu khuyến nghị → "ĐÁP ỨNG TỐT".
7. Storage chỉ đánh giá đủ dung lượng cài đặt, không đánh giá hiệu năng.
8. Nếu thiếu dữ liệu → "Không đủ dữ liệu để kết luận".
9. Không đưa ra nhận xét về khả năng tương thích linh kiện nếu không có dữ liệu.

Trả lời ngắn gọn theo mẫu:

[KẾT LUẬN]
...

[PHÂN TÍCH]
- OS: ...
- CPU: ...
- GPU: ...
- RAM: ...
- Storage: ...

[VẤN ĐỀ CHÍNH]
...

[ĐỀ XUẤT]
...

Chỉ đưa ra kết luận dựa trên dữ liệu GameFit cung cấp.
YÊU CẦU: Trả lời dưới 70 chữ, đi thẳng vào vấn đề, TUYỆT ĐỐI KHÔNG dùng Markdown (không dùng dấu ** hay *), xưng "Mình" gọi "Bạn".`;

        if (req.query.stream === 'true') {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
            });

            for await (const chunk of responseStream) {
                if (chunk.text) {
                    res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
            });

            return res.status(200).json({
                success: true,
                advice: response.text
            });
        }

    } catch (error) {
        console.error('AI Error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Lỗi AI: ' + (error.message || 'Unknown') });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Lỗi AI: ' + error.message })}\n\n`);
            res.end();
        }
    }
};

const summarizeReviews = async (req, res) => {
    try {
        const { reviews } = req.body;
        
        if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({ success: false, message: 'Không có đánh giá nào để tóm tắt.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({
                success: true,
                summary: "Tính năng AI chưa được cấu hình API Key."
            });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const reviewsText = reviews.map((r, i) => `${i+1}. ${r.rating} sao: ${r.comment}`).join('\n').substring(0, 4000);

        const prompt = `Bạn là AI phân tích cộng đồng GameFit.
Dưới đây là các đánh giá về một tựa game:
${reviewsText}

Nhiệm vụ: Tóm tắt ngắn gọn đánh giá của người dùng thành 2 phần: Điểm cộng và Điểm trừ.
YÊU CẦU: Trả lời ngắn gọn dưới 80 chữ, dùng gạch đầu dòng, TUYỆT ĐỐI KHÔNG dùng Markdown (không dùng dấu ** hay *).`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });

        return res.status(200).json({
            success: true,
            summary: response.text
        });

    } catch (error) {
        console.error('AI Error (Review):', error);
        return res.status(500).json({ success: false, message: 'Lỗi AI: ' + (error.message || 'Unknown') });
    }
};

const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(200).json({ success: true, reply: "Tính năng này cần cấu hình API Key." });

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = `Bạn là GameFit Bot - trợ lý ảo thông minh của nền tảng GameFit.
Nhiệm vụ: Hướng dẫn người dùng cách sử dụng hệ thống.
Thông tin hệ thống:
1. Mục Games: Tìm và xem chi tiết tựa game, tải game.
2. Kiểm tra cấu hình: So sánh máy người dùng với yêu cầu Game để xem chơi mượt không (có AI tư vấn nâng cấp).
3. Wishlist: Lưu game yêu thích.
4. Đánh giá Game: Cộng đồng chia sẻ, có AI tóm tắt đánh giá.
YÊU CẦU: Trả lời siêu ngắn gọn, thân thiện, súc tích (dưới 80 chữ), xưng "GameFit Bot" gọi "Bạn". TUYỆT ĐỐI KHÔNG dùng dấu ** hay *.

Tin nhắn người dùng: "${message}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });

        return res.status(200).json({
            success: true,
            reply: response.text
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ AI.' });
    }
};

module.exports = { adviseUpgrade, summarizeReviews, chatWithAI };
