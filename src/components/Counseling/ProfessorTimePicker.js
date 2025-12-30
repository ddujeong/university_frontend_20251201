// ProfessorTimePicker.js

import React, { useState } from "react";
import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import ko from "date-fns/locale/ko";
import { useModal } from "../ModalContext";
// import "../../pages/SchedulePage.css";

registerLocale("ko", ko);
// YYYY-MM-DD 포맷팅 함수 (유지)
const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 💡 [수정] slots, loading, bookAppointment를 props로 받습니다.
const ProfessorTimePicker = ({
  slots,
  loading,
  bookAppointment, // 💡 [추가] 부모로부터 예약 함수를 받습니다.
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { showModal } = useModal();
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  }; // 💡 [완성] handleTimeClick 함수: 부모의 예약 함수를 호출합니다.

  const handleTimeClick = async (slotId, time) => {
    showModal({
      type: "confirm",
      message: `${time}시에 상담을 신청하시겠습니까?`,
      onConfirm: async () => {
        try {
          await bookAppointment(slotId, time); // 예약 성공 처리는 부모 컴포넌트(handleBook)에서 alert 및 목록 갱신을 수행함
        } catch (error) {
          console.error("예약 요청 오류:", error);
        }
      },
    });
  };

  const selectedDateString = formatDateToYYYYMMDD(selectedDate); // 디버깅 로그 유지 (최종적으로는 삭제 권장)
  const availableTimesForSelectedDate = slots
    .filter(
      (slot) =>
        slot.status === "OPEN" &&
        slot.startTime?.substring(0, 10) === selectedDateString
    )
    .map((slot) => ({
      // 시간 추출 로직
      id: slot.id,
      time: new Date(slot.startTime).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      // 예약 시 원본 1시간 슬롯 ID 사용
    }))
    .sort((a, b) => a.time.localeCompare(b.time)); // 달력에서 과거 날짜 선택 방지

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <p>날짜와 시간 선택 후 예약 바랍니다.</p>
      {/* 캘린더 (날짜 선택) */}
      <div className="datepicker-wrapper">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateSelect}
          dateFormat="yyyy.MM.dd"
          inline
          minDate={today} // 과거 날짜 선택 방지
          locale="ko"
        />
      </div>
      {/* <p>선택된 날짜 : {selectedDate.toLocaleDateString("ko-KR")}</p> */}
      {/* 시간 버튼 목록 */}
      <div>
        {loading ? (
          <div className="loading-text">슬롯 로딩 중...</div>
        ) : availableTimesForSelectedDate.length === 0 ? (
          <p>해당 날짜에 예약 가능한 시간이 없습니다.</p>
        ) : (
          <div>
            {availableTimesForSelectedDate.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleTimeClick(slot.id, slot.time)}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfessorTimePicker;
