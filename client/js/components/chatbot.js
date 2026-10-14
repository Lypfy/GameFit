function initChatbot() {
    if (document.querySelector('.ai-chatbot-widget')) return;

    // Inject CSS
    const pathname = window.location.pathname.toLowerCase();
    const isInSubfolder = pathname.includes('/user/') || pathname.includes('/admin/') || pathname.includes('/auth/');
    const cssPrefix = isInSubfolder ? '../../css/' : '../css/';
    const assetPrefix = isInSubfolder ? '../../assets/' : '../assets/';

    function injectChatbot() {
        if (document.querySelector('.ai-chatbot-widget')) return;

        // Inject HTML
        const chatbotHTML = `
            <div class="ai-chatbot-widget" id="ai-chatbot-widget">
                <div class="chatbot-window" id="chatbot-window">
                    <div class="chatbot-header" id="chatbot-header" title="Kéo để di chuyển cửa sổ">
                        <h3><img src="${assetPrefix}chiikawa.jpg" alt="Chiikawa" draggable="false" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;"> Jett</h3>
                        <button class="chatbot-close" id="chatbot-close" title="Đóng">&times;</button>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="chat-msg bot">Xin chào! Mình là Jett, trợ lý ảo của bạn. Bạn cần hướng dẫn tính năng nào của trang web không?</div>
                        <div class="chat-typing" id="chat-typing">Jett đang gõ...</div>
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chat-input-text" placeholder="Nhập câu hỏi của bạn..." autocomplete="off">
                        <button id="chat-send-btn" title="Gửi"><i class='bx bxs-send'></i></button>
                    </div>
                </div>
                <button class="chatbot-btn" id="chatbot-btn" title="Kéo để di chuyển • Nhấp để mở Trợ lý Jett (Click đúp để về góc mặc định)">
                    <img src="${assetPrefix}chiikawa.jpg" alt="Chiikawa Avatar" draggable="false" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);

        // Logic & Elements
        const chatbotWidget = document.getElementById('ai-chatbot-widget');
        const chatbotBtn = document.getElementById('chatbot-btn');
        const chatbotHeader = document.getElementById('chatbot-header');
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotClose = document.getElementById('chatbot-close');
        const chatInput = document.getElementById('chat-input-text');
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatMessages = document.getElementById('chatbot-messages');
        const chatTyping = document.getElementById('chat-typing');

        // Tự động căn chỉnh hướng mở của cửa sổ chat theo vị trí widget
        function updateWindowPosition() {
            if (!chatbotWindow || !chatbotWidget) return;
            const rect = chatbotWidget.getBoundingClientRect();
            const winHeight = 470;
            const winWidth = 360;

            // Kiểm tra chiều dọc: nếu gần đỉnh màn hình thì mở chúc xuống
            if (rect.top < winHeight && (window.innerHeight - rect.bottom) >= 200) {
                chatbotWindow.classList.add('open-down');
            } else {
                chatbotWindow.classList.remove('open-down');
            }

            // Kiểm tra chiều ngang: nếu gần mép trái màn hình thì mở sang phải
            if (rect.left < (winWidth - 60)) {
                chatbotWindow.classList.add('open-right');
            } else {
                chatbotWindow.classList.remove('open-right');
            }
        }

        // Áp dụng vị trí dựa trên góc neo (anchor) để không bị xê dịch khi zoom màn hình
        function applyPosition(pos) {
            if (!pos || !chatbotWidget) return;
            const padding = 10;
            const btnSize = chatbotBtn.offsetWidth || 60;
            const maxX = Math.max(padding, window.innerWidth - btnSize - padding);
            const maxY = Math.max(padding, window.innerHeight - btnSize - padding);

            if (pos.anchorX === 'right') {
                const offset = Math.max(padding, Math.min(pos.offsetRight ?? 30, maxX));
                chatbotWidget.style.right = `${offset}px`;
                chatbotWidget.style.left = 'auto';
            } else {
                const offset = Math.max(padding, Math.min(pos.offsetLeft ?? 30, maxX));
                chatbotWidget.style.left = `${offset}px`;
                chatbotWidget.style.right = 'auto';
            }

            if (pos.anchorY === 'bottom') {
                const offset = Math.max(padding, Math.min(pos.offsetBottom ?? 30, maxY));
                chatbotWidget.style.bottom = `${offset}px`;
                chatbotWidget.style.top = 'auto';
            } else {
                const offset = Math.max(padding, Math.min(pos.offsetTop ?? 30, maxY));
                chatbotWidget.style.top = `${offset}px`;
                chatbotWidget.style.bottom = 'auto';
            }

            updateWindowPosition();
        }

        // Khôi phục vị trí đã lưu từ localStorage
        function restorePosition() {
            try {
                const saved = localStorage.getItem('gamefit_chatbot_position');
                if (!saved) return;
                const pos = JSON.parse(saved);
                if (!pos || !pos.anchorX || !pos.anchorY) {
                    // Nếu dữ liệu cũ không có anchor, dọn dẹp để quay về mặc định
                    localStorage.removeItem('gamefit_chatbot_position');
                    return;
                }
                applyPosition(pos);
            } catch (err) {
                console.warn('Không thể tải vị trí chatbot:', err);
            }
        }

        // Bật / tắt cửa sổ chatbot
        function toggleChatWindow() {
            chatbotWindow.classList.toggle('active');
            if (chatbotWindow.classList.contains('active')) {
                updateWindowPosition();
                chatInput.focus();
            }
        }

        chatbotClose.addEventListener('click', (e) => {
            e.stopPropagation();
            chatbotWindow.classList.remove('active');
        });

        // Click đúp vào icon để reset về vị trí góc dưới bên phải mặc định
        chatbotBtn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                localStorage.removeItem('gamefit_chatbot_position');
            } catch (err) { }
            chatbotWidget.style.left = '';
            chatbotWidget.style.top = '';
            chatbotWidget.style.right = '';
            chatbotWidget.style.bottom = '';
            chatbotWindow.classList.remove('open-down', 'open-right');
        });

        // ================= Xử lý Kéo thả (Drag & Drop) =================
        let isPointerDown = false;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let dragDistance = 0;
        let activePointerId = null;
        let dragTarget = null;
        const DRAG_THRESHOLD = 5; // Khoảng cách pixel tối thiểu để tính là kéo

        function handlePointerDown(e) {
            // Chỉ chấp nhận chuột trái hoặc cảm ứng
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            // Không kéo khi click vào nút đóng, ô nhập hoặc nút gửi
            if (e.target.closest('#chatbot-close') || e.target.closest('input') || e.target.closest('button:not(#chatbot-btn)')) {
                return;
            }

            isPointerDown = true;
            isDragging = false;
            dragDistance = 0;
            startX = e.clientX;
            startY = e.clientY;
            dragTarget = e.currentTarget;
            activePointerId = e.pointerId;

            const rect = chatbotWidget.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            try {
                dragTarget.setPointerCapture(activePointerId);
            } catch (err) { }
        }

        function handlePointerMove(e) {
            if (!isPointerDown) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            dragDistance = Math.hypot(dx, dy);

            if (!isDragging && dragDistance >= DRAG_THRESHOLD) {
                isDragging = true;
                chatbotWidget.classList.add('is-dragging');
            }

            if (isDragging) {
                const btnSize = chatbotBtn.offsetWidth || 60;
                const padding = 10;
                const maxX = Math.max(padding, window.innerWidth - btnSize - padding);
                const maxY = Math.max(padding, window.innerHeight - btnSize - padding);

                let newX = initialLeft + dx;
                let newY = initialTop + dy;

                newX = Math.max(padding, Math.min(newX, maxX));
                newY = Math.max(padding, Math.min(newY, maxY));

                chatbotWidget.style.left = `${newX}px`;
                chatbotWidget.style.top = `${newY}px`;
                chatbotWidget.style.right = 'auto';
                chatbotWidget.style.bottom = 'auto';

                updateWindowPosition();
            }
        }

        function handlePointerUp(e) {
            if (!isPointerDown) return;
            isPointerDown = false;

            if (dragTarget && activePointerId !== null) {
                try {
                    dragTarget.releasePointerCapture(activePointerId);
                } catch (err) { }
            }
            dragTarget = null;
            activePointerId = null;

            if (isDragging) {
                isDragging = false;
                setTimeout(() => {
                    chatbotWidget.classList.remove('is-dragging');
                }, 50);

                // Tính toán vị trí neo (anchor) theo cạnh gần nhất
                const rect = chatbotWidget.getBoundingClientRect();
                const btnSize = chatbotBtn.offsetWidth || 60;
                const padding = 10;

                const isRightSide = (rect.left + btnSize / 2) >= (window.innerWidth / 2);
                const isBottomSide = (rect.top + btnSize / 2) >= (window.innerHeight / 2);

                const newPos = {
                    anchorX: isRightSide ? 'right' : 'left',
                    anchorY: isBottomSide ? 'bottom' : 'top',
                    offsetRight: isRightSide ? Math.round(Math.max(padding, window.innerWidth - rect.right)) : undefined,
                    offsetLeft: !isRightSide ? Math.round(Math.max(padding, rect.left)) : undefined,
                    offsetBottom: isBottomSide ? Math.round(Math.max(padding, window.innerHeight - rect.bottom)) : undefined,
                    offsetTop: !isBottomSide ? Math.round(Math.max(padding, rect.top)) : undefined
                };

                // Áp dụng neo để chuyển đổi từ left/top sang right/bottom cố định
                applyPosition(newPos);

                try {
                    localStorage.setItem('gamefit_chatbot_position', JSON.stringify(newPos));
                } catch (err) { }
            }
        }

        // Hỗ trợ kéo thả trên cả nút Icon AI và thanh tiêu đề Chatbot
        [chatbotBtn, chatbotHeader].forEach((elem) => {
            if (!elem) return;
            elem.addEventListener('pointerdown', handlePointerDown);
            elem.addEventListener('pointermove', handlePointerMove);
            elem.addEventListener('pointerup', handlePointerUp);
            elem.addEventListener('pointercancel', handlePointerUp);
        });

        // Click vào nút để mở/đóng cửa sổ (chỉ kích hoạt nếu không phải là thao tác kéo)
        chatbotBtn.addEventListener('click', (e) => {
            if (dragDistance >= DRAG_THRESHOLD) {
                dragDistance = 0;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            dragDistance = 0;
            toggleChatWindow();
        });

        // Khi cửa sổ thay đổi kích thước hoặc zoom, duy trì vị trí neo mà không làm xáo trộn tọa độ
        window.addEventListener('resize', () => {
            const saved = localStorage.getItem('gamefit_chatbot_position');
            if (saved) {
                try {
                    const pos = JSON.parse(saved);
                    applyPosition(pos);
                } catch (err) { }
            }
            updateWindowPosition();
        });

        // Áp dụng vị trí đã lưu
        restorePosition();

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
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();

                chatTyping.style.display = 'none';
                if (data.success) {
                    appendMessage(data.reply, 'bot');
                } else {
                    appendMessage("Xin lỗi, mình đang gặp sự cố. Bạn thử lại sau nhé!", 'bot');
                }
            } catch (e) {
                chatTyping.style.display = 'none';
                appendMessage("Lỗi kết nối. Vui lòng thử lại!", 'bot');
            }
        }

        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    if (!document.querySelector('link[href*="chatbot.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${cssPrefix}components/chatbot.css`;
        link.onload = () => injectChatbot();
        document.head.appendChild(link);
    } else {
        injectChatbot();
    }
}

// Khởi chạy ngay khi load file
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
