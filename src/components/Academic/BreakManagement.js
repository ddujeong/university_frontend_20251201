import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import BreakAppModal from "../MyPage/BreakModal";
import { useModal } from "../ModalContext";

const BreakManagement = ({ role }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { showModal } = useModal();
  useEffect(() => {
    getLeaveList();
  }, []);

  const getLeaveList = async () => {
    try {
      const res = await api.get("/break/list");
      setLeaveRequests(res.data);
    } catch (err) {
      console.error(err);
      showModal({
        type: "alert",
        message:
          err.response?.data?.message ||
          err.message ||
          "휴학 내역을 불러오는 중 오류가 발생했습니다.",
      });
    }
  };

  const handleUpdateStatus = async (updatedId) => {
    setLeaveRequests((prev) => prev.filter((req) => req.id !== updatedId));
  };
  return (
    <>
      <h3>휴학 처리</h3>
      {leaveRequests.length === 0 ? (
        <p>대기 중인 신청 내역이 없습니다.</p>
      ) : (
        <div className="table-wrapper">
          <table className="course-table">
            <thead>
              <tr>
                <th>신청일자</th>
                <th>신청자 학번</th>
                <th>구분</th>
                <th>시작학기</th>
                <th>종료학기</th>
                <th>신청서 확인</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((req, index) => (
                <tr key={req.id}>
                  <td>{req.appDate}</td>
                  <td>{req.student.id}</td>
                  <td>{req.type}</td>
                  <td>
                    {req.fromYear}년 {req.fromSemester}학기
                  </td>
                  <td>
                    {req.toYear}년 {req.toSemester}학기
                  </td>
                  <td>
                    <button onClick={() => setSelectedRequest(req)}>
                      Click
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* 모달 */}
      <BreakAppModal
        show={!!selectedRequest}
        app={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        handleUpdateStatus={handleUpdateStatus}
        role={role}
        onDeleted={getLeaveList}
      />
    </>
  );
};

export default BreakManagement;
