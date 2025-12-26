import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notiApi } from "../../api/aiApi";
import { EventSourcePolyfill } from "event-source-polyfill";
import "./NotificationBell.css";
import { useModal } from "../ModalContext";

const NotificationBell = ({ user, openChatbot }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal();
  const BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8888";
  useEffect(() => {
    if (user) {
      loadInitialNotifications();
    }
  }, [user]);

  const loadInitialNotifications = async () => {
    try {
      const res = await notiApi.getMyNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("초기 알림 로드 실패");
    }
  };

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token"); // 또는 쿠키 등 토큰 저장 위치
    const eventSource = new EventSourcePolyfill(
      //"http://localhost:8888/api/notification/subscribe", // 백엔드 주소 확인
      `${BASE_URL}/notification/subscribe`, // ★ AWS 배포할때
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        heartbeatTimeout: 86400000, // 연결 유지 시간 설정
      }
    );

    eventSource.onopen = () => {};

    eventSource.addEventListener("notification", (e) => {
      const newNoti = JSON.parse(e.data);

      setNotifications((prev) => [newNoti, ...prev]);

      showModal({
        type: "alert",
        message: `새로운 알림이 도착했습니다.\n 알림함을 확인해주세요.`,
      });
    });

    eventSource.onerror = (err) => {
      console.error("SSE 연결 에러", err);
      eventSource.close(); // 에러나면 닫고 재연결 시도 로직 필요 시 추가
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const isChatbotNotification = (noti) => {
    return (
      noti.type !== "PROFESSOR_MESSAGE" && noti.content?.includes("[상담 권장]")
    );
  };
  const buildChatbotMessage = (noti) => {
    if (noti.content?.includes("[상담 권장]")) {
      return "학업 상담이 필요하다는 알림을 받았어요. 어떤 도움을 받을 수 있나요?";
    }
    return noti.content;
  };

  const handleClick = async (noti) => {
    try {
      if (!noti.Checked) {
        await notiApi.markAsRead(noti.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === noti.id ? { ...n, Checked: true } : n))
        );
      }
      if (isChatbotNotification(noti)) {
        openChatbot(buildChatbotMessage(noti));
        setIsOpen(false);
        return;
      }
      if (noti.url) {
        if (noti.type === "PROFESSOR_MESSAGE") {
          const senderName = noti.senderName
            ? noti.senderName + " 교수님"
            : "교수님";
          showModal({
            type: "confirm",
            message: `${senderName}이(가) 보낸 알림입니다.\n상담 페이지로 이동하시겠습니까?`,
            onConfirm: async () => {
              navigate(noti.url);
              setIsOpen(false);
            },
          });
        } else {
          navigate(noti.url);
          setIsOpen(false);
        }
      }
    } catch (err) {
      showModal({
        type: "alert",
        message: "오류가 발생했습니다. 잠시후 다시 이용해주세요.",
      });
    }
  };

  const handleDelete = async (e, notiId) => {
    e.stopPropagation();
    try {
      await notiApi.deleteNotification(notiId);
      setNotifications((prev) => prev.filter((n) => n.id !== notiId));
    } catch (err) {
      showModal({
        type: "alert",
        message: "삭제 중 오류가 발생했습니다.",
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.Checked).length;

  return (
    <div className="noti-container">
      <div className="noti-icon-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <span className="material-symbols-outlined noti-icon">
          notifications
        </span>
        {unreadCount > 0 && <span className="noti-badge">{unreadCount}</span>}
      </div>

      {isOpen && (
        <div className="noti-dropdown">
          <div className="noti-header">알림함</div>
          <ul className="noti-list">
            {notifications.length === 0 ? (
              <li className="noti-empty">새로운 알림이 없습니다.</li>
            ) : (
              notifications.map((noti) => {
                let displayContent = noti.content;

                if (noti.type === "PROFESSOR_MESSAGE" && noti.senderName) {
                  displayContent = `[${noti.senderName} 교수님 메시지] ${noti.content}`;
                } else if (noti.type === "AI_RISK" || !noti.type) {
                  displayContent = `${noti.content}`;
                }

                return (
                  <li
                    key={noti.id}
                    className={`noti-item ${noti.Checked ? "read" : "unread"}`}
                    onClick={() => handleClick(noti)}
                    style={{ cursor: "pointer" }}
                  >
                    {/*  포맷팅된 내용 표시 */}
                    <p className="noti-content">{displayContent}</p>

                    <button
                      onClick={(e) => handleDelete(e, noti.id)}
                      className="delete-btn"
                    >
                      x
                    </button>
                    <span className="noti-date">
                      {new Date(noti.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
