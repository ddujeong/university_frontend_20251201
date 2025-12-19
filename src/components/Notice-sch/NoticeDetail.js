import React, { useEffect, useState } from "react";
import {
  getNoticeDetail,
  deleteNotice,
  incrementNoticeViews,
} from "../../api/noticeApi";
import { useModal } from "../ModalContext";

const NoticeDetail = ({ noticeId, role, onBack, onEdit }) => {
  const [notice, setNotice] = useState(null);
  const { showModal } = useModal();
  useEffect(() => {
    const fetchAndIncrement = async () => {
      try {
        await incrementNoticeViews(noticeId);
        const data = await getNoticeDetail(noticeId);
        setNotice(data);
      } catch (error) {
        console.error("데이터 로드 또는 조회수 증가 실패", error);
      }
    };
    fetchAndIncrement();
  }, [noticeId]);

  if (!notice) return <div>로딩중...</div>;

  const handleDelete = async () => {
    showModal({
      type: "confirm",
      message: "이 공지사항을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await deleteNotice(noticeId);
          showModal({
            type: "alert",
            message: "삭제되었습니다.",
          });
          onBack(); // 삭제 후 목록으로
        } catch (error) {
          showModal({
            type: "alert",
            message: "삭제에 실패하였습니다.",
          });
        }
      },
    });
  };

  return (
    <>
      <h2 className="counseling-detail-header">
        <span className="counseling-detail-category">{notice.category}</span>{" "}
        {notice.title}
      </h2>

      <p className="counseling-detail-info">
        <span className="counseling-detail-views">
          조회수: {notice.views || 0}
        </span>
      </p>

      {notice.imageUrl && (
        <img
          className="notice-detail__image"
          src={notice.imageUrl}
          alt="첨부 이미지"
        />
      )}

      <p
        className="counseling-detail-content"
        dangerouslySetInnerHTML={{ __html: notice.content }}
      />

      <small className="counseling-detail-info">
        작성일: {new Date(notice.createdTime).toLocaleString()}
      </small>

      <div className="counseling-detail-buttons">
        {role === "staff" && (
          <>
            <button
              className="counseling-detail-button counseling-detail-button--edit"
              onClick={() => onEdit(notice.id)}
            >
              수정
            </button>
            <button
              className="counseling-detail-button counseling-detail-button--delete"
              onClick={handleDelete}
            >
              삭제
            </button>
          </>
        )}
        <button
          className="counseling-detail-button counseling-detail-button--back"
          onClick={onBack}
        >
          목록
        </button>
      </div>
    </>
  );
};

export default NoticeDetail;
