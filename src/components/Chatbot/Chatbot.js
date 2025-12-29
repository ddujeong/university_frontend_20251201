import React, { useState, useEffect, useRef } from "react";
import { chatApi } from "../../api/aiApi";
import { Link } from "react-router-dom";
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

  // ★ [추가 1] 스크롤 기능을 위한 Ref
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  const guides = [
    {
      label: "📊 내 성적/학점 분석",
      query: "📊 내 성적/학점 분석",
    },
    {
      label: "📅 이번 학기 시간표",
      query: "📅 이번 학기 시간표",
    },
    {
      label: "📜 휴학 신청",
      query: "📜 휴학 신청",
    },
    {
      label: "💬 교수님 상담 신청",
      query: "💬 교수님 상담 신청",
    },
  ];

  // ★ [추가 2] 스크롤 중지 함수
  const stopScroll = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // ★ [추가 3] 마우스 감지 및 자동 스크롤 로직
  const handleMouseMove = (e) => {
    const container = scrollRef.current;
    if (!container) return;

    const { left, width } = container.getBoundingClientRect();
    const x = e.clientX - left; // 컨테이너 내부 X 좌표
    const zoneSize = 60; // 감지 영역 (픽셀)
    const speed = 5; // 스크롤 속도

    // 이미 실행 중인 애니메이션이 있다면 취소 (새 방향 적용을 위해)
    stopScroll();

    if (x < zoneSize) {
      // [왼쪽 영역 감지]
      const scrollLeft = () => {
        container.scrollLeft -= speed;
        if (container.scrollLeft > 0) {
          animationRef.current = requestAnimationFrame(scrollLeft);
        }
      };
      scrollLeft();
    } else if (x > width - zoneSize) {
      // [오른쪽 영역 감지]
      const scrollRight = () => {
        container.scrollLeft += speed;
        if (
          container.scrollLeft <
          container.scrollWidth - container.clientWidth
        ) {
          animationRef.current = requestAnimationFrame(scrollRight);
        }
      };
      scrollRight();
    }
  };

  // ★ [추가 4] 마우스가 나가면 스크롤 중지
  const handleMouseLeave = () => {
    stopScroll();
  };

  // ★ [추가 5] 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => stopScroll();
  }, []);

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

          {/* ★ [수정] 가이드 영역에 핸들러 연결 */}
          <div className="guide-sticky-container">
            <div
              className="guide-scroll-wrapper"
              ref={scrollRef} // Ref 연결
              onMouseMove={handleMouseMove} // 마우스 움직임 감지
              onMouseLeave={handleMouseLeave} // 마우스 나감 감지
            >
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