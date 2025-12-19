import React, { useState, useEffect } from "react";
import { getScheduleList } from "../../api/scheduleApi";

const ScheduleList = ({ onSelect, onActionComplete }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await getScheduleList();
      setSchedules(data);
    } catch (error) {
      console.error("일정 목록 조회 실패:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [onActionComplete]);

  if (loading) return <div>⏳ 학사 일정 로딩 중...</div>;
  if (schedules.length === 0) return <div>등록된 학사 일정이 없습니다.</div>;

  return (
    <div className="table-wrapper">
      <table className="course-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>날짜</th>
            <th>내용</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id} onClick={() => onSelect(s.id, "detail")}>
              <td>{s.id}</td>
              <td>
                {s.startDay?.substring(5)}~{s.endDay?.substring(5)}
              </td>

              <td>{s.information}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleList;
