// src/components/Schedule/ScheduleForm.js
import React, { useState, useEffect } from "react";
import {
  createSchedule,
  updateSchedule,
  getScheduleDetail,
} from "../../api/scheduleApi";
import { useModal } from "../ModalContext";

const ScheduleForm = ({ id, onSubmit }) => {
  const [form, setForm] = useState({
    startDay: "",
    endDay: "",
    information: "",
  });
  const { showModal } = useModal();
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const data = await getScheduleDetail(id);
          setForm(data);
        } catch (err) {
          showModal({
            type: "alert",
            message: err.response?.data?.message || "불러오는데 실패했습니다.",
          });
        }
      };
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await updateSchedule(id, form);
        showModal({
          type: "alert",
          message: "일정이 수정되었습니다.",
        });
      } else {
        await createSchedule(form);
        showModal({
          type: "alert",
          message: "일정이 등록되었습니다.",
        });
      }

      onSubmit(); // 부모에서 목록 갱신 or 모달 닫기
    } catch (err) {
      showModal({
        type: "alert",
        message: err.response?.data?.message || "저장 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="change-password-form">
      <div className="input-group">
        <label>시작날짜</label>
        <input
          type="date"
          name="startDay"
          value={form.startDay}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>종료날짜</label>
        <input
          type="date"
          name="endDay"
          value={form.endDay}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>내용</label>
        <input
          type="text"
          name="information"
          value={form.information}
          onChange={handleChange}
        />
      </div>
      <button type="submit">저장</button>
    </form>
  );
};

export default ScheduleForm;
