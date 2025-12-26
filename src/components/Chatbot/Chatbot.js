import React, { useState, useEffect, useRef } from "react";
import { chatApi } from "../../api/aiApi";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./Chatbot.css";
import { useModal } from "../ModalContext";

const Chatbot = ({ user, isOpen, onClose, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const studentId = user.id;
  const chatBodyRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const { showModal } = useModal();
  const guides = [
    {
      label: "📊 내 성적/학점 분석",
      query: "내 현재 성적과 총 이수 학점을 분석해서 요약해줘.",
    },
    {
      label: "📅 이번 학기 시간표",
      query: "내가 이번 학기에 듣는 과목들이랑 일정 알려줘.",
    },
    {
      label: "📜 휴학/복학 신청",
      query: "휴학 신청 방법이나 절차에 대해 알려줘.",
    },
    {
      label: "💬 교수님 상담 신청",
      query: "우리 학과 교수님들 정보랑 상담 예약하는 법 알려줘.",
    },
  ];

  const handleGuideClick = async (query) => {
    if (isTyping) return;
    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await chatApi.ask(studentId, query);
      setMessages((prev) => [...prev, { sender: "ai", text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "오류가 발생했습니다." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };
  const handleClear = async () => {
    try {
      await chatApi.clearHistory(studentId);
      setMessages([]);
      initialSentRef.current = false;
      onClose();
      showModal({
        type: "alert",
        message: "대화가 종료되었습니다.",
      });
    } catch (err) {
      showModal({
        type: "alert",
        message: "대화삭제중 오류가 발생했습니다.",
      });
    }
  };

  useEffect(() => {
    if (isOpen && studentId) loadHistory();
  }, [isOpen, studentId]);

  const loadHistory = async () => {
    try {
      const res = await chatApi.getHistory(studentId);
      const history = res.data
        .map((log) => [
          { sender: "user", text: log.question },
          { sender: "ai", text: log.answer },
        ])
        .flat();
      setMessages(history);
    } catch (err) {
      showModal({
        type: "alert",
        message: "대화를 불러오는 중 오류가 발생했습니다.",
      });
    }
  };
  const initialSentRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !initialMessage) return;
    if (initialSentRef.current) return;

    initialSentRef.current = true;

    setMessages((prev) => [...prev, { sender: "user", text: initialMessage }]);

    (async () => {
      try {
        const res = await chatApi.ask(user.id, initialMessage);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: res.data.answer },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "오류가 발생했습니다." },
        ]);
      }
    })();
  }, [isOpen, initialMessage]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await chatApi.ask(studentId, userMsg.text);
      const aiMsg = { sender: "ai", text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "오류가 발생했습니다." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const MarkdownComponents = {
    a: ({ href, children }) => {
      if (href && !href.startsWith("http"))
        return (
          <Link
            to={href}
            style={{
              color: "#007bff",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            {children}
          </Link>
        );
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff" }}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>학사 도우미 AI</span>
            <div>
              <button
                onClick={handleClear}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffcccc",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
                title="대화 기록 삭제"
              >
                🗑️ 종료
              </button>
            </div>
          </div>
          <div className="guide-sticky-container">
            <div className="guide-scroll-wrapper">
              {guides.map((guide, idx) => (
                <button
                  key={idx}
                  className="guide-chip"
                  onClick={() => handleGuideClick(guide.query)}
                  disabled={isTyping}
                >
                  {guide.label}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {/* 2. 대화 시작 전 환영 문구만 남기기 */}
            {messages.length === 0 && !isTyping && (
              <div className="welcome-message">
                <span className="ai-icon">🤖</span>
                <p>
                  안녕하세요! 무엇이든 물어보세요.
                  <br />
                  위의 추천 키워드를 클릭하면 빠르게 답변을 받을 수 있습니다.
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>
                {msg.sender === "ai" ? (
                  <ReactMarkdown components={MarkdownComponents}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message ai typing">
                <div className="dot-flashing"></div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isTyping ? "AI가 답변을 작성 중입니다..." : "질문하세요..."
              }
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className={isTyping ? "btn-disabled" : ""}
            >
              {isTyping ? "생성 중" : "전송"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
