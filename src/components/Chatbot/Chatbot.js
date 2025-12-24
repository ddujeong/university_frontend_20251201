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
  const { showModal } = useModal();
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
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    try {
      const res = await chatApi.ask(studentId, userMsg.text);
      const aiMsg = { sender: "ai", text: res.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "오류가 발생했습니다." },
      ]);
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

          <div className="chat-body" ref={chatBodyRef}>
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
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="질문하세요..."
            />
            <button onClick={handleSend}>전송</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
