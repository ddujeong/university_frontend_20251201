import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import CourseStudentList from "./CourseStudentList";
import CoursePlanPage from "./CoursePlanPage";
import { useModal } from "../ModalContext";

const ProfCourse = ({ role, user }) => {
  const [subYear, setSubYear] = useState(""); // 초기값 빈 문자열 → 전체 조회
  const [semester, setSemester] = useState(""); // 초기값 빈 문자열 → 전체 조회
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [syllabusCourseId, setSyllabusCourseId] = useState(null);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const { showModal } = useModal();
  // 초기 전체 데이터 로딩
  useEffect(() => {
    getSubjectList(); // 처음엔 필터 없이 전체 조회
  }, []);

  const getSubjectList = async (filter = {}) => {
    try {
      const params = {};
      // filter 객체에 값이 있을 때만 params에 추가
      if (filter.subYear) params.subYear = parseInt(filter.subYear);
      if (filter.semester) params.semester = parseInt(filter.semester);

      const res = await api.get("/prof", { params });
      setCourses(res.data);
    } catch (err) {
      showModal({
        type: "alert",
        message: "강의목록을 불러오는데 실패했습니다.",
      });
      setCourses([]);
    }
  };

  // 조회 버튼 클릭
  const handleSearch = () => {
    getSubjectList({ subYear, semester });
  };

  const openSyllabus = (courseId) => {
    setSyllabusCourseId(courseId);
    setShowSyllabus(true);
  };
  const goBack = () => {
    setSelectedCourseId(null);
  };

  // 학생목록 버튼 → 컴포넌트 교체
  const openStudentList = (courseId) => {
    setSelectedCourseId(courseId);
  };
  return (
    <div>
      {/* 🔥 학생 리스트 화면 */}
      {selectedCourseId && (
        <CourseStudentList courseId={selectedCourseId} goBack={goBack} />
      )}

      {/* 🔥 강의 목록 화면 */}
      {!selectedCourseId && (
        <>
          <h3>내 강의 조회</h3>
          <div className="department-form" style={{ marginBottom: "15px" }}>
            <label>연도</label>
            <select
              value={subYear}
              onChange={(e) => setSubYear(e.target.value)}
            >
              <option value="">전체</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <label>학기</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">전체</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>

            <button className="search-btn" onClick={handleSearch}>
              조회
            </button>
          </div>
          <div className="table-wrapper">
            <table className="course-table">
              <thead>
                <tr>
                  <th>학수번호</th>
                  <th>강의명</th>
                  <th>강의시간</th>
                  <th>강의계획서</th>
                  <th>학생 목록</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      조회된 강의가 없습니다.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td className="course-name">{c.name}</td>
                      <td>
                        {c.subDay} {c.startTime}:00-{c.endTime}:00 ({c.roomId})
                      </td>
                      <td>
                        <button
                          className="small-btn"
                          onClick={() => openSyllabus(c.id)}
                        >
                          조회
                        </button>
                      </td>
                      <td>
                        <button
                          className="small-btn"
                          onClick={() => openStudentList(c.id)}
                        >
                          조회
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <CoursePlanPage
            role={role}
            user={user}
            show={showSyllabus}
            subjectId={syllabusCourseId}
            onClose={() => {
              setShowSyllabus(false);
              setSyllabusCourseId(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default ProfCourse;
