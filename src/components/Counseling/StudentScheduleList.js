import React, { useState, useEffect } from "react";
import { getStudentSchedules, cancelAppointment } from "../../api/scheduleApi";
import "../../pages/SchedulePage.css"; // 💡 이 파일을 import 해야 합니다.
import { counselingApi } from "../../api/counselingApi";
import { useModal } from "../ModalContext";

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const StudentScheduleList = ({ studentId, onSelect, listRefreshKey }) => {
  // key props를 refreshKey로 받음
  const [schedules, setSchedules] = useState([]);
  const { showModal } = useModal();
  useEffect(() => {
    if (!studentId) return;
    const fetchSchedules = async () => {
      try {
        const data = await getStudentSchedules(studentId);
        setSchedules(data);
      } catch (err) {
        showModal({
          type: "alert",
          message: err.message || "상담 목록을 불러오는데 실패했습니다.",
        });
      }
    };
    fetchSchedules();
  }, [studentId, listRefreshKey]);
  const handleEnter = async (schedule) => {
    try {
      const res = await counselingApi.checkEntry(schedule.scheduleId);
      if (!res.data.canEnter) {
        showModal({
          type: "alert",
          message: res.data.reason,
        });
        return;
      }

      // 2️⃣ 실제 입장 처리 (IN_PROGRESS 전환)
      await counselingApi.enterRoom(schedule.scheduleId);
      onSelect({
        ...schedule,
        id: schedule.scheduleId,
      });
    } catch (err) {
      showModal({
        type: "alert",
        message:
          err.response?.data?.message || "상담 입장 중 오류가 발생했습니다.",
      });
    }
  };

  const handleCancel = async (scheduleId) => {
    showModal({
      type: "confirm",
      message: "예약을 취소하시겠습니까?",
      onConfirm: async () => {
        try {
          await cancelAppointment(scheduleId);
          setSchedules((prev) =>
            prev.map((s) =>
              s.scheduleId === scheduleId ? { ...s, status: "취소됨" } : s
            )
          );
          showModal({
            type: "alert",
            message: "예약이 취소되었습니다.",
          });
        } catch (err) {
          showModal({
            type: "alert",
            message: "예약 취소에 실패했습니다." || err.message,
          });
        }
      },
    });
  };
  // 💡 클래스 적용
  if (!studentId) return <div>로그인이 필요합니다.</div>;
  if (schedules.length === 0) return <div>예약된 상담 일정이 없습니다.</div>;
  return (
    <>
      <h3>나의 상담 일정</h3>
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>교수</th>
              <th>시간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => {
              const now = new Date();
              const startTime = new Date(s.startTime);
              const endTime = new Date(s.endTime);

              const isExpired = now > endTime;

              const canEnter =
                !isExpired &&
                ((s.status === "예약 완료" && now >= startTime) ||
                  s.status === "상담 진행중");

              const canCancel =
                !isExpired &&
                (s.status === "확인중" ||
                  (s.status === "예약 완료" && now < startTime));

              return (
                <tr key={s.scheduleId}>
                  <td>{s.professorName || "정보 없음"}</td>
                  <td>
                    {formatDateTime(s.startTime)} ~ {formatDateTime(s.endTime)}
                  </td>
                  <td>
                    {s.status}
                    {canEnter && (
                      <button
                        className="btn-start"
                        onClick={() => handleEnter(s)}
                      >
                        상담
                      </button>
                    )}

                    {!canEnter && canCancel && (
                      <button
                        className="btn-cancel"
                        style={{ marginLeft: "15px", padding: 6 }}
                        onClick={() => handleCancel(s.scheduleId)}
                      >
                        취소
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentScheduleList;
