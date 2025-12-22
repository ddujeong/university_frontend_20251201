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
  // 1. 초기 데이터 로드 (새로고침 시 기존 알림 가져오기)
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

  // 2. [핵심] 실시간 알림 구독 (SSE 연결)
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

    // [이벤트 수신] 백엔드에서 emitter.send().name("notification") 한 것
    eventSource.addEventListener("notification", (e) => {
      const newNoti = JSON.parse(e.data); // 전송된 알림 데이터

      // 기존 목록 맨 앞에 새 알림 추가
      setNotifications((prev) => [newNoti, ...prev]);

      // (선택) 알림음 재생 or 브라우저 알림 띄우기 가능
      showModal({
        type: "alert",
        message: `새로운 알림이 도착했습니다.\n 알림함을 확인해주세요.`,
      });
    });

    // 에러 발생 시
    eventSource.onerror = (err) => {
      console.error("SSE 연결 에러", err);
      eventSource.close(); // 에러나면 닫고 재연결 시도 로직 필요 시 추가
    };

    // 컴포넌트가 사라질 때(언마운트) 연결 끊기
    return () => {
      eventSource.close();
    };
  }, [user]);

  // ... (handleClick, handleDelete, render 부분은 기존과 동일) ...
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

  // 3. 알림 클릭 처리
  const handleClick = async (noti) => {
    try {
      // 읽음 처리 (API 호출) / 백엔드 isread 변경
      if (!noti.Checked) {
        await notiApi.markAsRead(noti.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === noti.id ? { ...n, Checked: true } : n))
        );
      }

      // 챗봇 알림 처리 (기존 유지)
      if (isChatbotNotification(noti)) {
        openChatbot(buildChatbotMessage(noti));
        setIsOpen(false);
        return;
      }

      // [핵심] URL이 있을 때만 이동
      if (noti.url) {
        //  교수 메시지인 경우 확인 Alert 표시
        if (noti.type === "PROFESSOR_MESSAGE") {
          const senderName = noti.senderName
            ? noti.senderName + " 교수님"
            : "교수님";

          const isConfirmed = window.confirm(
            `${senderName}이(가) 보낸 알림입니다.\n상담 페이지로 이동하시겠습니까?`
          );

          if (!isConfirmed) {
            return; // '아니오'를 누르면 여기서 함수 종료
          }
        }

        // 페이지 이동 실행
        navigate(noti.url);
        setIsOpen(false); // 창 닫기
      } else {
        // console.warn("⚠️ 이동할 URL이 없습니다. (DB에 url 컬럼이 비어있음)");
        // showModal({
        //   type: "alert",
        //   message: "이동할 링크가 없는 알림입니다.",
        // });
      }
    } catch (err) {
      showModal({
        type: "alert",
        message: "오류가 발생했습니다. 잠시후 다시 이용해주세요.",
      });
    }
  };

  // 알림 삭제 핸들러
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

  //  'Checked' 대신 'isRead' 사용
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
                //  알림 내용 포맷팅 로직
                let displayContent = noti.content;

                if (noti.type === "PROFESSOR_MESSAGE" && noti.senderName) {
                  displayContent = `[${noti.senderName} 교수님 메시지] ${noti.content}`;
                } else if (noti.type === "AI_RISK" || !noti.type) {
                  displayContent = `[AI 알림] ${noti.content}`;
                }

                return (
                  <li
                    key={noti.id}
                    //  'Checked' 대신 'isRead' 사용
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
