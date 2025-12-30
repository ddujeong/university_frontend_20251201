import { Outlet } from "react-router-dom";
import Header from "../Home/Header";
import Footer from "../Home/Footer";
import Chatbot from "../Chatbot/Chatbot";
import { useState } from "react";

const MainLayout = ({ user, role, logout }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotMessage, setChatbotMessage] = useState(null);

  const openChatbot = (message) => {
    if (role !== "student") return;
    setChatbotMessage(message || null);
    setIsChatbotOpen(true);
  };

  const closeChatbot = () => {
    setIsChatbotOpen(false);
    setChatbotMessage(null);
  };
  const toggleChatbot = () => {
    if (role !== "student") return;

    setIsChatbotOpen((prev) => {
      const next = !prev;

      // 닫을 때 메시지 초기화
      if (!next) {
        setChatbotMessage(null);
      }

      return next;
    });
  };

  return (
    <>
      <Header user={user} role={role} logout={logout} />
      <main className="page">
        <Outlet context={{ openChatbot }} />
      </main>
      <Footer />
      {role === "student" && (
        <>
          <button className="chat-btn" onClick={toggleChatbot}>
            챗봇🤖
          </button>

          <Chatbot
            user={user}
            isOpen={isChatbotOpen}
            onClose={closeChatbot}
            initialMessage={chatbotMessage}
          />
        </>
      )}
    </>
  );
};

export default MainLayout;
