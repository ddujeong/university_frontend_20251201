import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";

const ProfStudentGradeInput = ({ student, courseId, goBack }) => {
  const [form, setForm] = useState({
    absent: 0,
    late: 0,
    assignment: 0,
    midterm: 0,
    final: 0,
    total: 0,
    grade: "A+",
  });
  const { showModal } = useModal();
  // 초기값 세팅
  useEffect(() => {
    if (student) {
      setForm({
        absent: student.absent ?? 0,
        late: student.lateness ?? 0,
        assignment: student.homework ?? 0,
        midterm: student.midExam ?? 0,
        final: student.finalExam ?? 0,
        total: student.convertedMark ?? 0,
        grade: student.grade ?? "A+",
      });
    }
  }, [student]);

  // 폼 값 변경 시
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["absent", "late", "assignment", "midterm", "final"].includes(
        name
      )
        ? value // 숫자로 바로 변환하지 않고 그대로 두기
        : value,
    }));
  };

  // 환산점수 및 등급 자동 계산
  useEffect(() => {
    let total =
      (form.assignment || 0) * 0.1 +
      (form.midterm || 0) * 0.4 +
      (form.final || 0) * 0.5;

    let grade = "F";
    if (form.absent >= 5) {
      total = 0;
      grade = "F";
    } else {
      if (total >= 90) grade = "A+";
      else if (total >= 85) grade = "A0";
      else if (total >= 80) grade = "B+";
      else if (total >= 75) grade = "B0";
      else if (total >= 70) grade = "C+";
      else if (total >= 65) grade = "C0";
      else if (total >= 60) grade = "D+";
      else if (total >= 50) grade = "D0";
      else grade = "F";
    }

    setForm((prev) => ({ ...prev, total: Math.round(total), grade }));
  }, [form.assignment, form.midterm, form.final, form.absent]);

  const handleSubmit = async () => {
    try {
      await api.put(`/prof/student/${student.stuSubId}`, {
        absent: form.absent,
        lateness: form.late,
        homework: form.assignment,
        midExam: form.midterm,
        finalExam: form.final,
        convertedMark: form.total,
        grade: form.grade,
      });
      showModal({
        type: "alert",
        message: "성적 저장이 완료되었습니다.",
      });
      goBack();
    } catch (error) {
      console.error(error);
      showModal({
        type: "alert",
        message: "성적 저장이 실패하였습니다.",
      });
    }
  };

  return (
    <>
      <h3>학생 성적 기입</h3>
      <button onClick={goBack}> 학생 리스트</button>

      <div>
        <p>
          <strong>학생 번호 :</strong> {student.studentId}
        </p>
        <p>
          <strong>이름 :</strong> {student.studentName}
        </p>
      </div>

      <div className="input-group">
        <label>결석</label>
        <input
          type="number"
          name="absent"
          value={form.absent}
          onChange={handleChange}
        />
        {form.absent >= 5 && (
          <p style={{ color: "red", margin: "4px 0" }}>
            ⚠ 결석 5회 이상으로 F 처리됩니다.
          </p>
        )}
      </div>
      <div className="input-group">
        <label>지각</label>
        <input
          type="number"
          name="late"
          value={form.late}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>과제점수</label>
        <input
          type="number"
          name="assignment"
          value={form.assignment}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>중간시험</label>
        <input
          type="number"
          name="midterm"
          value={form.midterm}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>기말시험</label>
        <input
          type="number"
          name="final"
          value={form.final}
          onChange={handleChange}
        />
      </div>
      <div className="input-group">
        <label>환산점수</label>
        <input type="number" name="total" value={form.total} readOnly />
      </div>
      <div className="input-group">
        <label>등급</label>
        <input type="text" name="grade" value={form.grade} readOnly />
      </div>

      <button onClick={handleSubmit}>저장</button>
    </>
  );
};

export default ProfStudentGradeInput;
