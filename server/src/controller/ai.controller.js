const { GoogleGenAI } = require('@google/genai');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');

// Hàm truy vấn dữ liệu từ CSDL để cung cấp bối cảnh cho Chatbot AI
const getChatbotDbContext = async (message, userId = null) => {
    let dbContextText = "";
    try {
        const pool = await sql.connect();
        
        // 1. Tìm kiếm game theo tên trong tin nhắn
        const allGamesRes = await pool.request().query("SELECT game_id, name, publisher, developer FROM Games");
        const allGames = allGamesRes.recordset || [];
        
        const matchedGames = [];
        const lowerMessage = message.toLowerCase();

        for (const game of allGames) {
            const cleanLowerName = game.name.toLowerCase().trim();
            if (lowerMessage.includes(cleanLowerName)) {
                matchedGames.push(game);
            } else {
                // Kiểm tra xem tin nhắn có chứa toàn bộ từ chính của tên game không (độ dài mỗi từ >= 3)
                const nameWords = cleanLowerName.split(/\s+/).filter(w => w.length >= 3);
                if (nameWords.length > 0) {
                    const matchedWordCount = nameWords.filter(w => lowerMessage.includes(w)).length;
                    if (matchedWordCount === nameWords.length) {
                        matchedGames.push(game);
                    }
                }
            }
        }

        if (matchedGames.length > 0) {
            dbContextText += `\n[DỮ LIỆU CSDL VỀ CÁC GAME LIÊN QUAN ĐƯỢC TÌM THẤY IN GAMEFIT]:\n`;
            for (const g of matchedGames.slice(0, 3)) {
                const detailRes = await pool.request()
                    .input("game_id", sql.Int, g.game_id)
                    .query("SELECT * FROM dbo.fn_GetGameDetail(@game_id)");
                const reqRes = await pool.request()
                    .input("game_id", sql.Int, g.game_id)
                    .query("SELECT * FROM dbo.fn_GetGameRequirementByID(@game_id)");

                const detail = detailRes.recordset?.[0];
                const reqs = reqRes.recordset || [];

                if (detail) {
                    dbContextText += `- Tên game: ${detail.name}\n`;
                    dbContextText += `  + Nhà phát hành: ${detail.publisher || 'N/A'}, Nhà phát triển: ${detail.developer || 'N/A'}\n`;
                    dbContextText += `  + Thể loại/Tags: ${detail.tags || 'N/A'}\n`;
                    dbContextText += `  + Mô tả: ${detail.description || 'Không có'}\n`;
                    dbContextText += `  + Yêu cầu cấu hình hệ thống từ CSDL:\n`;
                    
                    reqs.forEach(r => {
                        dbContextText += `    * [${r.type}]: CPU (${r.cpu_name || 'N/A'}), GPU (${r.gpu_name || 'N/A'}), RAM (${r.ram || 0}GB), Storage (${r.storage || 0}GB), OS (${r.os || 'N/A'})\n`;
                    });
                }
            }
        } else {
            // Kiểm tra xem tin nhắn có chứa thể loại/tag nào không
            const allTagsRes = await pool.request().query("SELECT tag_id, name FROM Tags");
            const allTags = allTagsRes.recordset || [];
            const matchedTags = allTags.filter(t => lowerMessage.includes(t.name.toLowerCase()));
            
            if (matchedTags.length > 0) {
                dbContextText += `\n[DANH SÁCH GAME THEO THỂ LOẠI TÌM THẤY TRONG CSDL]:\n`;
                for (const tag of matchedTags.slice(0, 2)) {
                    const tagGamesRes = await pool.request()
                        .input("tag_id", sql.Int, tag.tag_id)
                        .query("SELECT * FROM dbo.fn_GetGamesByTag(@tag_id)");
                    const tagGames = (tagGamesRes.recordset || []).slice(0, 5);
                    dbContextText += `- Thể loại "${tag.name}": ${tagGames.map(g => g.name).join(", ")}\n`;
                }
            } else {
                // Lấy một số game nổi bật
                const topGamesRes = await pool.request().query("SELECT TOP 8 game_id, name, publisher FROM Games");
                const topGames = topGamesRes.recordset || [];
                dbContextText += `\n[DANH SÁCH MỘT SỐ GAME TRONG CSDL GAMEFIT]:\n`;
                topGames.forEach(g => {
                    dbContextText += `- ${g.name} (Nhà phát hành: ${g.publisher || 'N/A'})\n`;
                });
            }
        }

        // 2. Lấy cấu hình máy tính đã lưu của User (nếu đã đăng nhập)
        if (userId) {
            const userPcRes = await pool.request()
                .input("user_id", sql.Int, userId)
                .query("SELECT * FROM dbo.fn_getComputersConfig(@user_id)");
            const userPcs = userPcRes.recordset || [];

            if (userPcs.length > 0) {
                dbContextText += `\n[CẤU HÌNH MÁY TÍNH ĐÃ LƯU CỦA KHÁCH HÀNG (USER TRONG CSDL)]: \n`;
                userPcs.forEach((pc, idx) => {
                    dbContextText += `- Máy ${idx + 1} (${pc.pc_name}): CPU (${pc.cpu_name}), GPU (${pc.gpu_name}), RAM (${pc.ram}GB), Storage (${pc.storage}GB), OS (${pc.os || 'Windows'})\n`;
                });
            }
        }

    } catch (err) {
        console.error("Lỗi khi lấy CSDL cho Chatbot:", err.message);
    }

    return dbContextText;
};

// Hàm tự tạo câu trả lời dự phòng từ CSDL khi chưa cấu hình Gemini API Key
const generateFallbackReplyFromContext = (dbContext, message) => {
    if (dbContext.includes('[DỮ LIỆU CSDL VỀ CÁC GAME LIÊN QUAN ĐƯỢC TÌM THẤY IN GAMEFIT]:')) {
        let reply = "Dựa vào cơ sở dữ liệu của GameFit:\n";
        
        const lines = dbContext.split('\n');
        let gameName = "";
        let minSpecs = "";
        let recSpecs = "";
        let userSpecs = "";

        lines.forEach(line => {
            if (line.startsWith('- Tên game:')) gameName = line.replace('- Tên game:', '').trim();
            if (line.includes('* [MINIMUM]:')) minSpecs = line.replace('* [MINIMUM]:', '').trim();
            if (line.includes('* [RECOMMENDED]:')) recSpecs = line.replace('* [RECOMMENDED]:', '').trim();
            if (line.startsWith('- Máy 1')) userSpecs = line.replace('- Máy 1', 'Máy của bạn').trim();
        });

        if (gameName) {
            reply += `🎮 Tựa game: ${gameName}\n`;
            if (minSpecs) reply += `📌 Cấu hình tối thiểu: ${minSpecs}\n`;
            if (recSpecs) reply += `🚀 Cấu hình khuyến nghị: ${recSpecs}\n`;
        }

        if (userSpecs) {
            reply += `\n💻 Cấu hình máy tính của bạn: ${userSpecs}\n`;
            reply += `=> Bạn có thể dùng tính năng 'Kiểm tra cấu hình' để AI so sánh chi tiết hơn nhé!`;
        } else {
            reply += `\n💡 Bạn chưa lưu cấu hình máy. Hãy vào mục 'Cấu hình thiết bị' để lưu máy của bạn và nhận đánh giá tự động nhé!`;
        }
        return reply;
    }

    return "Xin chào! Mình là GameFit Bot. Dựa vào CSDL của GameFit, mình có thể tư vấn cấu hình tối thiểu/khuyến nghị của các tựa game và so sánh với máy tính của bạn. Bạn muốn tra cứu tựa game nào?";
};

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
4. Không đạt bất kỳ yêu cầu tối thiểu nào → "KHÔNG ĐẠT TỐI THIỂU". Phải ghi rõ linh kiện nào chưa đạt (CPU, GPU, RAM hay Storage) và cần nâng cấp linh kiện nào.
5. Đạt tối thiểu nhưng chưa đạt khuyến nghị → "CÓ THỂ CHẠY NHƯNG CHƯA TỐI ƯU". Gợi ý linh kiện cần nâng cấp lên khuyến nghị.
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

[VẤN ĐỀ CHÍNH & NÂNG CẤP CẦN THIẾT]
- Chỉ rõ cụ thể CPU / GPU / RAM / Storage nào chưa đạt và cần nâng cấp từ bao nhiêu lên bao nhiêu.

[ĐỀ XUẤT]
...

Chỉ đưa ra kết luận dựa trên dữ liệu GameFit cung cấp.
YÊU CẦU: Trả lời ngắn gọn, đi thẳng vào vấn đề, TUYỆT ĐỐI KHÔNG dùng Markdown (không dùng dấu ** hay *), xưng "Mình" gọi "Bạn".`;

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

        const reviewsText = reviews.map((r, i) => `${i + 1}. ${r.rating} sao: ${r.comment}`).join('\n').substring(0, 4000);

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
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung câu hỏi.' });
        }

        // 1. Kiểm tra và giải mã Token người dùng (nếu có) để lấy user_id
        let userId = null;
        const authHeader = req.header("Authorization");
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "GAMEFIT_SECRET_KEY");
                userId = decoded.user_id;
            } catch (e) {
                // Token không hợp lệ hoặc hết hạn -> tiếp tục với quyền khách
            }
        }

        // 2. Lấy dữ liệu ngữ cảnh từ Cơ sở dữ liệu GameFit (Thông tin game, Cấu hình yêu cầu, Cấu hình máy người dùng)
        const dbContext = await getChatbotDbContext(message, userId);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Khi chưa có API Key, phản hồi trực tiếp dựa trên dữ liệu vừa kết xuất từ CSDL
            const fallbackReply = generateFallbackReplyFromContext(dbContext, message);
            return res.status(200).json({
                success: true,
                reply: fallbackReply
            });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const prompt = `Bạn là GameFit Bot - trợ lý ảo tư vấn game và cấu hình máy tính chuyên nghiệp của nền tảng GameFit.
Nhiệm vụ của bạn: Dựa vào DỮ LIỆU CƠ SỞ DỮ LIỆU GAMEFIT (CSDL) bên dưới để trả lời trực tiếp và chính xác câu hỏi của khách hàng.

=== DỮ LIỆU CƠ SỞ DỮ LIỆU GAMEFIT (CSDL) ===
${dbContext}
============================================

QUY TẮC BẮT BUỘC:
1. Luôn sử dụng dữ liệu cấu hình game và cấu hình máy tính từ CSDL ở trên để trả lời.
2. Nếu khách hàng hỏi xem máy của họ có chơi được game hay không:
   - Liệt kê cụ thể yêu cầu tối thiểu của game từ CSDL (CPU, GPU, RAM, Storage).
   - Đối chiếu với cấu hình máy của khách hàng từ CSDL (nêu rõ tên linh kiện CPU, GPU, RAM của máy khách hàng).
   - Đưa ra kết luận trực tiếp xem máy khách hàng có đạt yêu cầu hay không.
3. Trả lời thân thiện, mạch lạc, dễ hiểu (khoảng 60 - 140 chữ), xưng "GameFit Bot" hoặc "Mình" và gọi người dùng là "Bạn".
4. TUYỆT ĐỐI KHÔNG dùng ký tự Markdown như ** hay * (dùng gạch đầu dòng - hoặc thụt lùi dòng).

Tin nhắn của khách hàng: "${message}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });

        let replyText = response.text || "";
        replyText = replyText.replace(/\*\*/g, '').replace(/\*/g, '');

        return res.status(200).json({
            success: true,
            reply: replyText
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ AI.' });
    }
};

module.exports = { adviseUpgrade, summarizeReviews, chatWithAI };
