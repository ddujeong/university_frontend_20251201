import { useEffect, useState } from "react";
import { deleteSchedule, getScheduleDetail } from "../../api/scheduleApi";
import { useModal } from "../ModalContext";

const ScheduleDetail = ({ id, onEdit, onDelete }) => {
  const [schedule, setSchedule] = useState(null);
  const { showModal } = useModal();

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const data = await getScheduleDetail(id);
        setSchedule(data);
      } catch (err) {
        showModal({
          type: "alert",
          message:
            err.response?.data?.message ||
            err.message ||
            "상세조회에 실패했습니다.",
        });
      }
    };

    fetchDetail();
  }, [id]);

  const handleDeleteClick = async () => {
    showModal({
      type: "confirm",
      message: "이 일정을 정말로 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await deleteSchedule(id);
          showModal({
            type: "alert",
            message: "일정이 삭제되었습니다.",
          });
          onDelete();
        } catch (err) {
          showModal({
            type: "alert",
            message:
              err.response?.data?.message ||
              err.message ||
              "일정 삭제에 실패했습니다.",
          });
        }
      },
    });
  };

  if (!schedule) return <div>로딩중...</div>;

  const year = schedule.startDay?.substring(0, 4) || "확인 불가";

  return (
    <>
      <p className="schedule-detail-title">{year}년 학교 학사일정</p>

      <div className="schedule-detail-row">
        <div className="schedule-detail-label">시작날짜</div>
        <div className="schedule-detail-value">
          {schedule.startDay?.substring(5)}
        </div>
      </div>

      <div className="schedule-detail-row">
        <div className="schedule-detail-label">종료날짜</div>
        <div className="schedule-detail-value">
          {schedule.endDay?.substring(5)}
        </div>
      </div>

      <div className="schedule-detail-row">
        <div className="schedule-detail-label">내용</div>
        <div className="schedule-detail-value">
          {schedule.information || schedule.notes}
        </div>
      </div>

      <div className="schedule-detail-actions">
        <button className="schedule-detail-button edit" onClick={onEdit}>
          수정
        </button>
        <button
          className="schedule-detail-button delete"
          onClick={handleDeleteClick}
        >
          삭제
        </button>
      </div>
    </>
  );
};
export default ScheduleDetail;
