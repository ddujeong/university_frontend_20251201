import React, { useEffect, useState } from "react";
import {
  getNoticeDetail,
  deleteNotice,
  incrementNoticeViews,
} from "../../api/noticeApi";

const NoticeDetail = ({ noticeId, role, onBack, onEdit }) => {
  const [notice, setNotice] = useState(null);

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
    if (window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
      try {
        await deleteNotice(noticeId);
        alert("삭제되었습니다.");
        onBack(); // 삭제 후 목록으로
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="notice-detail">
      <h2 className="notice-detail__title">
        {" "}
        <span className="notice-detail__category">{notice.category}</span>
        {notice.title}
      </h2>

      <p className="notice-detail__meta">
        <span className="notice-detail__views">
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
        className="notice-detail__content"
        dangerouslySetInnerHTML={{ __html: notice.content }}
      />

      <small className="notice-detail__created">
        작성일: {new Date(notice.createdTime).toLocaleString()}
      </small>

      <div className="notice-detail__buttons">
        {role === "staff" && (
          <>
            <button
              className="notice-detail__btn notice-detail__btn--edit"
              onClick={() => onEdit(notice.id)}
            >
              수정
            </button>
            <button
              className="notice-detail__btn notice-detail__btn--delete"
              onClick={handleDelete}
            >
              삭제
            </button>
          </>
        )}
        <button
          className="notice-detail__btn notice-detail__btn--back"
          onClick={onBack}
        >
          목록
        </button>
      </div>
    </div>
  );
};

export default NoticeDetail;
