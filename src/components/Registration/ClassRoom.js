import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";

const Classroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [colleges, setColleges] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [newCollegeId, setNewCollegeId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { showModal } = useModal();
  const getColleges = async () => {
    try {
      const res = await api.get("/admin/college");
      setColleges(res.data);
    } catch (err) {
      showModal({
        type: "alert",
        message: "단과대 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  useEffect(() => {
    getList();
    getColleges();
  }, [page]);

  const getList = async () => {
    try {
      const res = await api.get("/admin/room", { params: { page } });
      if (res.data && res.data.content) {
        setClassrooms(res.data.content); // 목록 세팅
        setTotalPages(res.data.totalPages); // 전체 페이지 수 세팅
      } else {
        setClassrooms([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error(err);
      setClassrooms([]);
      showModal({
        type: "alert",
        message: "강의실 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom || !newCollegeId)
      return showModal({
        type: "alert",
        message: "단과대와 강의실명을 입력해주세요.",
      });
    try {
      await api.post("/admin/room", {
        id: newRoom,
        college: { id: newCollegeId },
      });
      showModal({
        type: "alert",
        message: `${newRoom} 등록 완료!`,
      });
      setNewRoom("");
      setNewCollegeId("");
      setShowAddForm(false);
      getList();
    } catch (err) {
      showModal({
        type: "alert",
        message: "등록에 실패하였습니다.",
      });
    }
  };

  const handleDeleteRoom = async (id) => {
    showModal({
      type: "confirm",
      message: `${id}을 삭제 하시겠습니까?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/room/${id}`);
          showModal({
            type: "alert",
            message: "강의실을 삭제하였습니다.",
          });
          getList(); // 삭제 후 리스트 갱신
        } catch (err) {
          showModal({
            type: "alert",
            message: "강의실 삭제에 실패하였습니다.",
          });
        }
      },
    });
  };

  return (
    <>
      <h3>강의실 관리</h3>

      <div className="form-row">
        <button onClick={() => setShowAddForm((prev) => !prev)}>등록</button>
      </div>

      {showAddForm && (
        <div className="department-form">
          <input
            type="text"
            placeholder="강의실을 입력해주세요"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
          />
          <select
            value={newCollegeId}
            onChange={(e) => setNewCollegeId(e.target.value)}
          >
            <option value="">단과대 선택</option>
            {colleges.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddRoom}>등록</button>
        </div>
      )}

      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>강의실</th>
              <th>단과대ID</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((room) => (
              <tr key={room.id}>
                <td>{room.id}</td>
                <td>{room.college.name}</td>
                <td>
                  <button onClick={() => handleDeleteRoom(room.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
};

export default Classroom;
