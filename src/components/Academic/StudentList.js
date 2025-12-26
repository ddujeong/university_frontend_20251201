import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchDept, setSearchDept] = useState("");
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  useEffect(() => {
    getList();
  }, [page]);
  const getList = async () => {
    try {
      const params = { page };
      if (searchDept) params.deptId = searchDept;
      if (searchId) params.studentId = searchId;

      const res = await api.get("/staff/list/student", { params });

      if (res.data.content) {
        setStudents(res.data.content);
        setTotalPages(res.data.totalPages);
      } else {
        const singleData = Array.isArray(res.data) ? res.data : [res.data];
        setStudents(singleData);
        setTotalPages(1);
      }
    } catch (err) {
      setStudents([]);
      showModal({ type: "alert", message: "목록 조회 실패" });
    }
  };

  const handleSearch = () => {
    setPage(0);
    getList();
  };
  const handleUpdateGrades = async () => {
    setLoading(true);
    try {
      await api.get("/staff/list/student/update");
      showModal({
        type: "alert",
        message: "전체 학생 학기 업데이트를 완료하였습니다.",
      });
      getList();
    } catch (err) {
      console.error(err);
      showModal({
        type: "alert",
        message: "학기 업데이트에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <h3>학생 명단 조회</h3>
      <div className="department-form">
        <input
          type="text"
          value={searchDept}
          onChange={(e) => setSearchDept(e.target.value)}
          placeholder="학과 번호"
        />

        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="학번"
        />
        <button onClick={handleSearch} className="search-btn">
          조회
        </button>
        <button onClick={handleUpdateGrades} disabled={loading}>
          {loading ? "업데이트 중..." : "새학기 적용"}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
              <th>생년월일</th>
              <th>성별</th>
              <th>주소</th>
              <th>전화번호</th>
              <th>이메일</th>
              <th>학과번호</th>
              <th>학년</th>
              <th>입학일</th>
              <th>졸업일(예정)</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? (
              students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.birthDate}</td>
                  <td>{student.gender}</td>
                  <td>{student.address}</td>
                  <td>{student.tel}</td>
                  <td>{student.email}</td>
                  <td>{student.department.id}</td>
                  <td>{student.grade}</td>
                  <td>{student.entranceDate}</td>
                  <td>{student.graduationDate || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: "center" }}>
                  조회된 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
};

export default StudentList;
