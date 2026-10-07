function initChatbot() {
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../css/components/chatbot.css';
    document.head.appendChild(link);

    // Inject HTML
    const chatbotHTML = `
        <div class="ai-chatbot-widget">
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <h3><img src="../assets/jett.jpg" alt="Jett" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;"> GameFit AI Guide</h3>
                    <button class="chatbot-close" id="chatbot-close">&times;</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-msg bot">Xin chào! Mình là GameFit Bot. Bạn cần hướng dẫn tính năng nào của trang web không?</div>
                    <div class="chat-typing" id="chat-typing">Bot đang gõ...</div>
                </div>
                <div class="chatbot-input">
                    <input type="text" id="chat-input-text" placeholder="Nhập câu hỏi của bạn..." autocomplete="off">
                    <button id="chat-send-btn"><i class='bx bxs-send'></i></button>
                </div>
            </div>
            <button class="chatbot-btn" id="chatbot-btn" title="Trợ lý AI Hướng Dẫn">
                <img src="../assets/jett.jpg" alt="Jett Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Logic
    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatInput = document.getElementById('chat-input-text');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chatbot-messages');
    const chatTyping = document.getElementById('chat-typing');

    chatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
        if (chatbotWindow.classList.contains('active')) {
            chatInput.focus();
        }
    });

    chatbotClose.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        msgDiv.textContent = text;
        chatMessages.insertBefore(msgDiv, chatTyping);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        appendMessage(text, 'user');
        chatInput.value = '';
        
        chatTyping.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            
            chatTyping.style.display = 'none';
            if (data.success) {
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage("Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé!", 'bot');
            }
        } catch(e) {
            chatTyping.style.display = 'none';
            appendMessage("Lỗi kết nối. Vui lòng thử lại!", 'bot');
        }
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Khởi chạy ngay khi load file
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
