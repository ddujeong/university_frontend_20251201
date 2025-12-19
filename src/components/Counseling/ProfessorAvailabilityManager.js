import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getProfessorAvailability, // 등록된 슬롯 조회
  closeAvailability, // 슬롯 닫기 (비활성화)
  setAvailability, // 슬롯 열기 (새 등록)
} from "../../api/scheduleApi";
import "../../pages/SchedulePage.css";
import { useModal } from "../ModalContext";

// YYYY-MM-DD 형식으로 포맷팅 (조회된 슬롯의 날짜 비교에 사용)
const getLocalDateString = (date) => date.toISOString().split("T")[0];

// HH:mm 형식으로 포맷팅 (시간 비교 및 표시용)
const formatTime = (date) =>
  date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// 💡 [추가된 함수] 로컬 시간 기준으로 YYYY-MM-DDTHH:mm:ss 형식 생성
// 이는 백엔드(Spring)의 LocalDateTime이 타임존 정보를 포함하지 않는 경우,
// UTC로 오인되지 않도록 로컬 타임존의 시간을 명확히 전달하기 위함입니다.
const getLocalDateTimeString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  // Z (UTC)를 붙이지 않아 서버가 로컬 시간으로 해석하도록 유도
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const ProfessorAvailabilityManager = ({ professorId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]); // 교수님의 모든 등록된 슬롯
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getProfessorAvailability(professorId);
      setSlots(data || []);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [professorId]);

  // 1. 해당 날짜의 1시간 단위 가능 시간 목록 생성 (09:00 ~ 18:00 기준)
  const allPossibleSlots = [];
  const startHour = 9;
  const endHour = 18;
  const today = new Date();

  // 오늘 날짜인 경우 현재 시간 이후 슬롯만 표시
  if (
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()
  ) {
    const now = today.getHours() * 60 + today.getMinutes();
    for (let h = startHour; h < endHour; h++) {
      // 현재 시간이 해당 시간대보다 늦으면 건너뛰기 (1시간 슬롯이 이미 끝났으면 제외)
      if (h * 60 + 60 <= now) continue;
      allPossibleSlots.push(h);
    }
  } else {
    // 오늘 이후 날짜는 전체 슬롯 생성
    for (let h = startHour; h < endHour; h++) {
      allPossibleSlots.push(h);
    }
  }

  // 2. 현재 등록된 슬롯과 비교하여 상태 결정 (🚨 비교 로직 수정)
  const timeSlots = allPossibleSlots.map((hour) => {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, 0, 0, 0); // 로컬 시간대의 9시, 10시 등으로 설정
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1시간 후

    // 비교를 위한 로컬 날짜/시간 문자열 준비
    const targetDateStr = getLocalDateString(slotStart);
    const targetTimeStr = formatTime(slotStart);

    const existingSlot = slots.find((s) => {
      const sDate = new Date(s.startTime); // 백엔드에서 받은 시간 (KST)

      // 💡 [수정] Date 객체의 getTime() 비교 대신, formatTime()을 이용한 시간 문자열 비교로 대체
      // 이는 타임존 오차로 인한 슬롯 매칭 오류를 방지합니다.
      const existingDateStr = getLocalDateString(sDate);
      const existingTimeStr = formatTime(sDate);

      return (
        existingDateStr === targetDateStr && existingTimeStr === targetTimeStr
      );
    });

    const isAvailable =
      existingSlot &&
      existingSlot.active &&
      (existingSlot.status === null || existingSlot.status === "OPEN"); // 백엔드 Status가 'OPEN'일 가능성 고려
    const isBooked =
      existingSlot &&
      (existingSlot.status === "REQUESTED" ||
        existingSlot.status === "CONFIRMED" ||
        existingSlot.status === "CLOSED"); // BOOKED는 예약 요청/확정 상태일 때만
    const isClosed = existingSlot && !existingSlot.active;

    return {
      time: targetTimeStr, // formatTime(slotStart)와 동일
      startTime: slotStart,
      endTime: slotEnd,
      id: existingSlot ? existingSlot.id : null,
      status: isAvailable
        ? "AVAILABLE"
        : isBooked
        ? "BOOKED"
        : isClosed
        ? "CLOSED"
        : "NOT_REGISTERED",
      slotData: existingSlot,
    };
  });

  // 3. 슬롯 열기/닫기 핸들러 ( API 전송 데이터 형식 수정)
  const handleSlotAction = async (slot) => {
    if (loading) return;
    setLoading(true);

    try {
      if (slot.status === "NOT_REGISTERED" || slot.status === "CLOSED") {
        showModal({
          type: "confirm",
          message: `${slot.time}시 상담을 등록하시겠습니까?`,
          onConfirm: async () => {
            try {
              await setAvailability({
                startTime: getLocalDateTimeString(slot.startTime),
                endTime: getLocalDateTimeString(slot.endTime),
              });
              showModal({
                type: "alert",
                message: "상담 가능 시간이 등록되었습니다.",
              });
            } catch (err) {
              showModal({
                type: "alert",
                message: err.message || "등록에 실패했습니다.",
              });
            }
          },
        });
        // 💡 [수정] UTC 문자열 대신 로컬 시간 기준 문자열 전송
      } else if (slot.status === "AVAILABLE") {
        // 슬롯 닫기: 예약 가능한 슬롯을 비활성화
        showModal({
          type: "confirm",
          message: `${slot.time}시를 상담을 닫으시겠습니까?`,
          onConfirm: async () => {
            try {
              await closeAvailability(slot.id);
              showModal({
                type: "alert",
                message: "상담 시간을 닫았습니다.",
              });
            } catch (err) {
              showModal({
                type: "alert",
                message: err.message || "등록에 실패했습니다.",
              });
            }
          },
        });
      } else if (slot.status === "BOOKED") {
        showModal({
          type: "alert",
          message: "이미 예약되었거나 처리 중인 시간은 수정할 수 없습니다.",
        });
        return;
      }
      // 갱신된 목록 다시 불러오기
      await fetchSlots();
    } catch (e) {
      showModal({
        type: "alert",
        message: e.message || "목록을 불러 올 수 없습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "slot-button available";
      case "BOOKED":
        return "slot-button booked";
      case "CLOSED":
        return "slot-button closed";
      case "NOT_REGISTERED":
        return "slot-button not-registered";
      default:
        return "slot-button";
    }
  };

  const getButtonLabel = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "열림";
      case "BOOKED":
        return "예약됨";
      case "CLOSED":
      case "NOT_REGISTERED":
        return "닫힘";
      default:
        return "관리";
    }
  };

  return (
    <>
      <h3>상담시간 관리</h3>

      {/* 캘린더 (날짜 선택) */}
      <div className="datepicker-wrapper">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy.MM.dd"
          inline
          minDate={new Date()} // 과거 날짜 선택 방지
        />
      </div>

      {/* 시간 슬롯 목록 */}
      <div>
        {loading ? (
          <div className="loading-text">로딩 중...</div>
        ) : timeSlots.length === 0 &&
          selectedDate.getTime() >= today.getTime() ? (
          <p className="info-message">
            오늘 이후 관리 가능한 시간이 없습니다 (09시~18시).
          </p>
        ) : (
          <div className="time-slots-list">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => handleSlotAction(slot)}
                disabled={loading || slot.status === "BOOKED"}
                className={getButtonClass(slot.status)}
              >
                {slot.time}
                <span>({getButtonLabel(slot.status)})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfessorAvailabilityManager;
