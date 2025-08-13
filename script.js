
// Kiểm tra hỗ trợ Speech Recognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!window.SpeechRecognition) {
    alert("Trình duyệt của bạn không hỗ trợ tính năng nhận dạng giọng nói. Hãy dùng Chrome, Edge hoặc Safari.");
} else {
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const startBtn = document.getElementById("start-btn");
    const resultBox = document.getElementById("result");
    const statusBox = document.getElementById("status");
    const langSelect = document.getElementById("lang-select");

    let isListening = false;
    let autoRestart = true;

    // Cập nhật ngôn ngữ khi thay đổi
    langSelect.addEventListener("change", () => {
        recognition.lang = langSelect.value;
    });

    startBtn.addEventListener("click", () => {
        if (!isListening) {
            try {
                recognition.lang = langSelect.value;
                recognition.start();
                statusBox.textContent = "🎤 Đang lắng nghe...";
                isListening = true;
            } catch (error) {
                console.warn("Không thể khởi động micro:", error);
            }
        } else {
            recognition.stop();
            statusBox.textContent = "⏹️ Đã dừng lắng nghe.";
            isListening = false;
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        resultBox.textContent = `Bạn nói: "${transcript}"`;
    };

    recognition.onerror = (event) => {
        console.error("Lỗi:", event.error);
        if (event.error === "not-allowed") {
            alert("❌ Bạn chưa cho phép truy cập micro. Hãy bật lại quyền micro trong trình duyệt.");
        } else if (event.error === "no-speech") {
            statusBox.textContent = "⚠️ Không nhận được âm thanh. Thử lại nhé!";
        } else {
            statusBox.textContent = "⚠️ Lỗi: " + event.error;
        }
        isListening = false;
    };

    recognition.onend = () => {
        if (isListening && autoRestart) {
            recognition.start(); // Tự động tiếp tục nghe
        } else {
            isListening = false;
            statusBox.textContent = "✅ Đã dừng lắng nghe.";
        }
    };
}
