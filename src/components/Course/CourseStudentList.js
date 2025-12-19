import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import ProfStudentGradeInput from "./ProfStudentGradeInput";
import { useModal } from "../ModalContext";

const CourseStudentList = ({ courseId, goBack }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { showModal } = useModal();
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await api.get(`/prof/student/${courseId}`);
      const dataWithIds = res.data.map((stu) => ({
        ...stu,
        stuSubId: stu.stuSubId, // 서버에서 꼭 stuSubId 받아오기
        absent: stu.absent ?? null,
        lateness: stu.lateness ?? null,
        homework: stu.homework ?? null,
        midExam: stu.midExam ?? null,
        finalExam: stu.finalExam ?? null,
        convertedMark: stu.convertedMark ?? null,
        grade: stu.grade ?? "A+",
      }));
      setStudents(dataWithIds);
    } catch (err) {
      showModal({
        type: "alert",
        message: "학생목록을 불러오는데 실패했습니다.",
      });
      setStudents([]);
    }
  };

  // 🔥 기입 버튼 클릭 시
  const handleInputClick = (stu) => {
    setSelectedStudent(stu);
  };

  // 🔙 성적 입력 → 학생 리스트로 돌아가기
  const handleBackToList = () => {
    setSelectedStudent(null);
    loadStudents(); // 저장 후 최신 데이터 불러오기
  };

  return (
    <div>
      {/* 🔥 성적 기입 화면 */}
      {selectedStudent && (
        <ProfStudentGradeInput
          student={selectedStudent}
          courseId={courseId}
          goBack={handleBackToList}
        />
      )}

      {/* 🔥 학생 리스트 화면 */}
      {!selectedStudent && (
        <>
          <h3>학생 리스트 조회</h3>
          <button onClick={goBack}>강의 목록으로</button>
          <div className="table-wrapper">
            <table className="course-table">
              <thead>
                <tr>
                  <th>학생 번호</th>
                  <th>이름</th>
                  <th>소속</th>
                  <th>결석</th>
                  <th>지각</th>
                  <th>과제점수</th>
                  <th>중간시험</th>
                  <th>기말시험</th>
                  <th>환산점수</th>
                  <th>점수 기입</th>
                </tr>
              </thead>

              <tbody>
                {students.map((stu) => (
                  <tr key={stu.studentId}>
                    <td>{stu.studentId}</td>
                    <td>{stu.studentName}</td>
                    <td>{stu.deptName}</td>
                    <td>{stu.absent ?? ""}</td>
                    <td>{stu.lateness ?? ""}</td>
                    <td>{stu.homework ?? ""}</td>
                    <td>{stu.midExam ?? ""}</td>
                    <td>{stu.finalExam ?? ""}</td>
                    <td>{stu.convertedMark ?? ""}</td>
                    <td>
                      <button onClick={() => handleInputClick(stu)}>
                        {stu.grade == null ? "수정" : "기입"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseStudentList;
