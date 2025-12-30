import api from "../../api/axiosConfig";
import "./BreakModal.css";
import { useModal } from "../ModalContext";

const BreakAppModal = ({
  show,
  onClose,
  app,
  onDeleted,
  role,
  handleUpdateStatus,
}) => {
  const { showModal } = useModal();
  if (!show || !app) return null;

  const handleCancel = async () => {
    showModal({
      type: "confirm",
      message: "휴학신청을 취소하시겠습니까?",
      onConfirm: async () => {
        try {
          await api.delete(`/break/detail/${app.id}`);
          showModal({
            type: "alert",
            message: "휴학신청이 취소되었습니다.",
          });
          onDeleted();
          onClose();
        } catch (err) {
          showModal({
            type: "alert",
            message:
              err.response?.data?.message || "휴학신청 취소에 실패하였습니다.",
          });
        }
      },
    });
  };

  const handleApproveReject = async (status) => {
    showModal({
      type: "confirm",
      message: `정말로 "${status}" 처리하시겠습니까?`,
      onConfirm: async () => {
        try {
          await api.put(`/break/update/${app.id}`, { status });
          showModal({
            type: "alert",
            message: `"${status}" 처리되었습니다.`,
          });
          handleUpdateStatus(app.id);
          onClose();
        } catch (err) {
          showModal({
            type: "alert",
            message:
              err.response?.data?.message || "휴학신청 처리에 실패하였습니다.",
          });
        }
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="break-modal-overlay">
      <div className="break-modal-content">
        <button className="break-modal-close" onClick={onClose}>
          ×
        </button>

        <h3 className="break-modal-title">휴학 신청서</h3>

        <table className="break-modal-table">
          <tbody>
            <tr>
              <td>단 과 대</td>
              <td>{app.student.department.college.name}</td>
              <td>학 과</td>
              <td>{app.student.department.name}</td>
            </tr>
            <tr>
              <td>학 번</td>
              <td>{app.student.id}</td>
              <td>학 년</td>
              <td>{app.student.grade}학년</td>
            </tr>
            <tr>
              <td>전 화 번 호</td>
              <td>{app.student.tel}</td>
              <td>성 명</td>
              <td>{app.student.name}</td>
            </tr>
            <tr>
              <td>주 소</td>
              <td colSpan="3">{app.student.address}</td>
            </tr>
            <tr>
              <td>기 간</td>
              <td colSpan="3">
                {app.fromYear}년 {app.fromSemester}학기부터 {app.toYear}년{" "}
                {app.toSemester}학기까지
              </td>
            </tr>
            <tr>
              <td>휴 학 구 분</td>
              <td colSpan="3">{app.type}</td>
            </tr>
          </tbody>
        </table>

        <p className="break-modal-text">
          위와 같이 휴학하고자 하오니 허가하여 주시기 바랍니다.
        </p>

        <p className="break-modal-date">{formatDate(app.appDate)}</p>

        <div className="break-modal-actions">
          {role === "student" && app.status !== "승인" && (
            <button onClick={handleCancel}>취소하기</button>
          )}
          {role === "staff" && (
            <>
              <button onClick={() => handleApproveReject("승인")}>승인</button>
              <button onClick={() => handleApproveReject("반려")}>반려</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreakAppModal;
