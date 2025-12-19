import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // 페이지 이동용
import { useModal } from "../ModalContext";
import { dashboardApi, notiApi } from "../../api/aiApi";
import Modal from "../Modal";

const ProfDashboard = ({ user }) => {
  const navigate = useNavigate();

  const [professorId, setProfessorId] = useState(null);
  const [professorname, setProfessorname] = useState();
  const [risks, setRisks] = useState([]); // 전체 데이터
  const [filteredRisks, setFilteredRisks] = useState([]); // 필터링된 데이터
  const [filterLevel, setFilterLevel] = useState("ALL"); // 필터 상태
  const [checkedIds, setCheckedIds] = useState(new Set()); // 체크된 항목들
  const { showModal } = useModal();
  // 교수 -> 학생 알림
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  // 교수 -> 학생 알림
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await dashboardApi.getRiskList(user.id);
      setRisks(res.data || []);
    } catch (err) {
      showModal({
        type: "alert",
        message: "목록을 불러오는 데 실패했습니다.",
      });
    }
  }, [user?.id, showModal]);
  // 1. 데이터 로딩
  useEffect(() => {
    if (!user) {
      showModal({
        type: "alert",
        message: "로그인이 필요합니다.",
      });
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  useEffect(() => {
    if (filterLevel === "ALL") {
      setFilteredRisks(risks);
    } else {
      setFilteredRisks(risks.filter((r) => r.riskLevel === filterLevel));
    }
  }, [filterLevel, risks]);
  const handleAllCheck = (e) => {
    if (e.target.checked) {
      setCheckedIds(new Set(filteredRisks.map((r) => r.id)));
    } else {
      setCheckedIds(new Set());
    }
  };
  const handleCheck = (id) => {
    const newChecked = new Set(checkedIds);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedIds(newChecked);
  };
  // 4. 일괄 삭제 (선택된 것들)
  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) {
      showModal({
        type: "alert",
        message: "학생을 선택해주세요.",
      });
      return;
    }
    showModal({
      type: "confirm",
      message: `선택한 ${checkedIds.size}명을 목록에서 삭제하시겠습니까?`,
      onConfirm: async () => {
        try {
          // 여러 개를 한 번에 삭제 (Promise.all 사용)
          const deletePromises = Array.from(checkedIds).map((id) =>
            dashboardApi.deleteRisk(id)
          );
          await Promise.all(deletePromises);

          // 화면 갱신
          setRisks((prev) => prev.filter((item) => !checkedIds.has(item.id)));
          setCheckedIds(new Set()); // 체크박스 초기화
          showModal({
            type: "alert",
            message: "삭제 완료하였습니다.",
          });
        } catch (err) {
          showModal({
            type: "alert",
            message: "삭제 중 오류가 발생했습니다.",
          });
        }
      },
    });
  };

  // 교수 -> 학생 알림
  const handleOpenNotificationModal = (risk) => {
    setTargetStudent({
      id: risk.studentId,
      name: risk.studentName,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMessageContent("");
    setTargetStudent(null);
  };

  const handleSendNotification = async () => {
    if (!messageContent.trim()) {
      showModal({
        type: "alert",
        message: "메세지를 입력해주세요.",
      });
      return;
    }
    showModal({
      type: "confirm",
      message: `${targetStudent.name} 학생에게 메세지를 전송하시겠습니까?`,
      onConfirm: async () => {
        try {
          await notiApi.sendDirectMessage(targetStudent.id, messageContent);
          showModal({
            type: "alert",
            message: `[${targetStudent.name}] 학생에게 메세지를 보냈습니다.`,
          });
          handleCloseModal();
        } catch (err) {
          showModal({
            type: "alert",
            message: "메세지 전송에 실패했습니다.",
          });
          console.error(err);
        }
      },
    });
  };
  // 교수 -> 학생 알림

  return (
    <>
      {/* 헤더 & 컨트롤 패널 */}
      <h3>중도이탈 위험학생 리스트</h3>

      <button onClick={handleBulkDelete}>선택 항목 삭제</button>

      {/* 데이터 테이블 */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleAllCheck}
                  checked={
                    checkedIds.size > 0 &&
                    checkedIds.size === filteredRisks.length
                  }
                />
              </th>
              <th>분석 날짜</th>
              <th>학번</th>
              <th>이름</th>
              <th>학년</th>
              <th>위험도</th>
              <th>상태</th>
              <th>AI 분석 원인</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredRisks.map((risk) => (
                <tr key={risk.id}>
                  {/* 체크박스 */}
                  <td>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(risk.id)}
                      onChange={() => handleCheck(risk.id)}
                    />
                  </td>
                  {/* 날짜 */}
                  <td>{risk.analyzedDate}</td>
                  <td>{risk.studentId}</td>
                  <td>{risk.studentName}</td>
                  <td>{risk.grade}</td>
                  <td>{risk.riskScore}점</td>
                  <td
                    style={{
                      color:
                        risk.riskLevel === "심각"
                          ? "red"
                          : risk.riskLevel === "경고"
                          ? "orange"
                          : "black",
                      fontWeight: "bold",
                    }}
                  >
                    {risk.riskLevel}
                  </td>
                  {/* 원인 (왼쪽 정렬) */}
                  <td>{risk.reason}</td>
                  {/* 버튼 그룹 */}
                  <td>
                    <div>
                      <button onClick={() => handleOpenNotificationModal(risk)}>
                        메세지
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/*  메시지 전송 모달  */}
      {isModalOpen && targetStudent && (
        <Modal onClose={handleCloseModal}>
          <h4 style={{ marginTop: 0 }}>
            {targetStudent?.name} 학생에게 메시지
          </h4>
          <textarea
            className="modal-textarea" // CSS에서 width: 100% 설정
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />
          <div>
            <button className="btn-secondary" onClick={handleCloseModal}>
              취소
            </button>
            <button className="btn-primary" onClick={handleSendNotification}>
              전송
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProfDashboard;
