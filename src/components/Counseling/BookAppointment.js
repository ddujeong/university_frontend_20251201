// BookAppointment.js

import React, { useEffect, useState } from "react";
import {
  getProfessorsByMyDepartment,
  getAvailableTimesByProfessor,
  bookAppointment, // 💡 bookAppointment API 함수
} from "../../api/scheduleApi";
import "../../pages/SchedulePage.css";

import ProfessorTimePicker from "./ProfessorTimePicker";
import { useModal } from "../ModalContext";

const BookAppointment = ({ user, onBooked }) => {
  const studentId = user.id;
  const [professors, setProfessors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  useEffect(() => {
    if (!studentId) return;
    const fetchInitialData = async () => {
      try {
        setLoading(true); // 1. 본인 학과 정보 가져오기
        const profs = await getProfessorsByMyDepartment();
        setProfessors(profs);
      } catch (err) {
        showModal({
          type: "alert",
          message: "상담 예약 정보를 불러오는 데 실패했습니다.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [studentId]);

  const handleProfessorSelect = async (prof) => {
    setSelectedProfessor(prof);
    setSlots([]);
    setLoading(true);
    try {
      const times = await getAvailableTimesByProfessor(prof.id);
      setSlots(times);
    } catch (e) {
      showModal({
        type: "alert",
        message: "상담 예약 정보를 불러오는 데 실패했습니다.",
      });
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }; // 💡 [수정] handleBook 함수: 슬롯 ID와 시간 문자열을 받아 예약 처리

  const handleBook = async (availabilityId, time) => {
    try {
      await bookAppointment(availabilityId);
      showModal({
        type: "alert",
        message: `예약 신청이 완료되었습니다.`,
      });
      handleProfessorSelect(selectedProfessor); // 부모 컴포넌트(StudentSchedulePage)에게 목록 갱신을 요청합니다.
      if (onBooked) onBooked();
    } catch (e) {
      showModal({
        type: "alert",
        message:
          e.response?.data?.message ||
          "예약 신청 중 알 수 없는 오류가 발생했습니다.",
      });
    }
  };

  if (!studentId)
    return <div className="info-message">로그인 후 이용해주세요.</div>;
  if (loading && professors.length === 0)
    return <div className="loading-text">내 학과 교수 목록 로딩 중...</div>;

  return (
    <>
      <h3>상담 예약</h3>
      {/* ② 교수 선택 */}
      {professors.length === 0 && !loading && (
        <p>현재 학과에 등록된 교수님이 없습니다.</p>
      )}

      <div>
        {professors.length === 0 && !loading ? (
          <p>현재 학과에 등록된 교수님이 없습니다.</p>
        ) : (
          <select
            value={selectedProfessor?.id || ""}
            onChange={(e) => {
              const prof = professors.find(
                (p) => p.id === Number(e.target.value)
              );
              if (prof) handleProfessorSelect(prof);
            }}
          >
            <option value="" disabled>
              교수님 선택
            </option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} 교수님
              </option>
            ))}
          </select>
        )}
      </div>
      {/* ③ 달력 컴포넌트 렌더링 */}
      {selectedProfessor && (
        <ProfessorTimePicker
          professor={selectedProfessor}
          studentId={studentId}
          onBooked={onBooked}
          slots={slots}
          loading={loading}
          bookAppointment={handleBook} // 💡 [추가] handleBook 함수를 prop으로 전달
        />
      )}
    </>
  );
};
export default BookAppointment;
