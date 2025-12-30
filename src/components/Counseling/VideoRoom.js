import React, { useState, useEffect, useCallback } from "react";
import { saveRecord } from "../../api/scheduleApi"; // 👈 API import 필요
import "./VideoRoom.css"; // 💡 CSS 파일을 여기에 import 해야 합니다.
import { useModal } from "../ModalContext";

/**
 * Janus WebRTC Video Room을 iFrame으로 로드하는 컴포넌트입니다.
 * 이 컴포넌트가 상담 시작 시 렌더링 됩니다.
 */
function VideoRoom({
  scheduleId,
  studentId,
  professorId,
  userRole,
  userName,
  onFinish,
  initialNotes,
  initialKeywords,
}) {
  const isProfessor = userRole === "professor" || userRole === "prof";
  const [notes, setNotes] = useState(initialNotes || "");
  const [keywords] = useState(initialKeywords || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showModal } = useModal();
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleFinishClick = () => {
    showModal({
      type: "confirm",
      message: isProfessor
        ? "상담을 종료하고 기록을 저장하시겠습니까?"
        : "상담 방에서 나가시겠습니까?",
      onConfirm: async () => {
        if (isProfessor) {
          await saveProfessorRecord();
        } else {
          onFinish(); // 학생은 바로 종료
        }
      },
    });
  };
  const saveProfessorRecord = async () => {
    setIsSubmitting(true);
    try {
      // 기록 저장 및 상담 상태를 'COMPLETED'로 변경하는 API 호출
      await saveRecord(scheduleId, notes, keywords);
      showModal({
        type: "alert",
        message: "상담 기록이 저장되었습니다.",
      });
      onFinish(); // 저장 성공 후 리스트로 이동
    } catch (err) {
      showModal({
        type: "alert",
        message:
          err.response?.data?.message || "기록 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const htmlFile = "videoroomtest.html";
  const iframeSrc = `${process.env.PUBLIC_URL}/${htmlFile}?room=${scheduleId}&role=${userRole}&display=${userName}`;

  return (
    // 💡 클래스 적용
    <div className="video-room-container">
      <div className="video-room-header">
        <h3>화상 상담실 ({scheduleId}번 방)</h3>
        <button
          className="btn-finish"
          onClick={handleFinishClick}
          disabled={isSubmitting}
        >
          {isProfessor ? "상담 종료 및 저장" : "나가기"}
        </button>
      </div>
      <div className="video-room-content">
        {/* 상단: 화상 영역 (가로 꽉 차게) */}
        <div className="video-section">
          <iframe
            src={iframeSrc}
            title={`Video Room ${scheduleId}`}
            id="JanusIframe"
            className="video-room-iframe"
            allow="camera; microphone; display-capture; autoplay"
          ></iframe>
        </div>

        {/* 하단: 교수 전용 기록 영역 */}
        {isProfessor && (
          <div className="record-section-bottom">
            <div className="record-title">
              <span>상담 내용 기록</span>
            </div>
            <textarea
              className="record-textarea-bottom"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="학생과의 상담을 기록해주세요."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoRoom;
