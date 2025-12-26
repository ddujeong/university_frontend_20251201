import React, { useState, useEffect } from "react";
import { courseApi } from "../../api/gradeApi";
import CoursePlanPage from "../Course/CoursePlanPage";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";

const CourseListPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [searchParams, setSearchParams] = useState({
    type: "",
    name: "",
    deptId: "",
    targetGrade: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    type: "",
    name: "",
    deptId: "",
    targetGrade: "",
  });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const { showModal } = useModal();
  // 초기 로딩
  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, appliedFilters]);

  const loadDepartments = async () => {
    try {
      const res = await courseApi.getDeptList();
      setDepartments(res.data || []);
    } catch (err) {
      showModal({
        type: "alert",
        message: "학과 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const loadData = async () => {
    try {
      const res = await courseApi.getSubjectList({
        page,
        type: appliedFilters.type,
        name: appliedFilters.name,
        deptId: appliedFilters.deptId,
        targetGrade: appliedFilters.targetGrade,
      });
      setSubjects(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      showModal({
        type: "alert",
        message: "강좌 목록을 불러오는데 실패했습니다.",
      });
      setSubjects([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handleSearch = () => {
    setPage(0);
    setAppliedFilters({ ...searchParams });
  };

  const openSyllabus = (courseId) => {
    setSelectedCourseId(courseId);
    setShowSyllabus(true);
  };

  return (
    <>
      <h3>강의 시간표 조회</h3>
      {/* 검색 필터 */}
      <div className="department-form">
        <select
          name="type"
          value={searchParams.type}
          onChange={handleInputChange}
        >
          <option value="">전체</option>
          <option value="전공">전공</option>
          <option value="교양">교양</option>
        </select>

        <select
          name="deptId"
          value={searchParams.deptId}
          onChange={handleInputChange}
        >
          <option value="">전체</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <input
          name="name"
          value={searchParams.name}
          onChange={handleInputChange}
          placeholder="강의명을 입력하세요"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />

        <button className="search-btn" onClick={handleSearch}>
          검색
        </button>
      </div>

      {/* 강의 테이블 */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>단과대학</th>
              <th>개설학과</th>
              <th>학수번호</th>
              <th>강의구분</th>
              <th>강의명</th>
              <th>담당교수</th>
              <th>학점</th>
              <th>요일/시간 (강의실)</th>
              <th>인원</th>
              <th>강의계획서</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  검색된 강좌가 없습니다.
                </td>
              </tr>
            ) : (
              subjects.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.department?.college?.name || "-"}</td>
                  <td>{sub.department?.name || "-"}</td>
                  <td>{sub.id}</td>
                  <td>{sub.type}</td>
                  <td className="course-name">{sub.name}</td>
                  <td>{sub.professor?.name || "미정"}</td>
                  <td>{sub.grades}</td>
                  <td>
                    {sub.subDay} {sub.startTime}~{sub.endTime} ({sub.room.id})
                  </td>
                  <td>
                    {sub.numOfStudent} / {sub.capacity}
                  </td>
                  <td>
                    <button
                      className="small-btn"
                      onClick={() => openSyllabus(sub.id)}
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

      {/* 페이지네이션 */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <CoursePlanPage
        show={showSyllabus}
        subjectId={selectedCourseId}
        onClose={() => {
          setShowSyllabus(false);
          setSelectedCourseId(null);
        }}
      />
    </>
  );
};

export default CourseListPage;
