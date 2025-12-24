import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";

const ProfessorList = () => {
  const [professors, setProfessors] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchDept, setSearchDept] = useState("");
  const [searchId, setSearchId] = useState("");
  const { showModal } = useModal();
  useEffect(() => {
    fetchProfessors();
  }, [page]);

  const fetchProfessors = async () => {
    try {
      const params = { page };
      if (searchDept) params.deptId = searchDept;
      if (searchId) params.professorId = searchId;

      const res = await api.get("/staff/list/professor", { params });

      if (res.data.content) {
        setProfessors(res.data.content);
        setTotalPages(res.data.totalPages);
      } else {
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setProfessors(data);
        setTotalPages(1);
      }
    } catch (err) {
      setProfessors([]);
      showModal({
        type: "alert",
        message: "교수 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchProfessors();
  };
  return (
    <>
      <h3>교수 명단 조회</h3>
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
          placeholder="사번"
        />
        <button onClick={handleSearch} className="search-btn">
          조회
        </button>
      </div>
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>사번</th>
              <th>이름</th>
              <th>생년월일</th>
              <th>성별</th>
              <th>주소</th>
              <th>전화번호</th>
              <th>이메일</th>
              <th>학과번호</th>
              <th>고용일</th>
            </tr>
          </thead>
          <tbody>
            {professors.length ? (
              professors.map((prof) => (
                <tr key={prof.id}>
                  <td>{prof.id}</td>
                  <td>{prof.name}</td>
                  <td>{prof.birthDate}</td>
                  <td>{prof.gender}</td>
                  <td>{prof.address}</td>
                  <td>{prof.tel}</td>
                  <td>{prof.email}</td>
                  <td>{prof.department.id}</td>
                  <td>{prof.hireDate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  조회된 교수가 없습니다.
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

export default ProfessorList;
