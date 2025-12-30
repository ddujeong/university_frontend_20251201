import React, { useState, useEffect } from "react";
import {
  createNotice,
  updateNotice,
  getNoticeDetail,
} from "../../api/noticeApi";
import { useModal } from "../ModalContext";

const NoticeForm = ({ noticeId, onBack }) => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "[일반]",
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const { showModal } = useModal();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  useEffect(() => {
    if (!noticeId) return;
    getNoticeDetail(noticeId).then((data) => {
      setForm({
        title: data.title,
        content: data.content,
        category: data.category,
        imageUrl: data.imageUrl || "",
      });
    });
  }, [noticeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. FormData 객체 생성
    const formData = new FormData();

    // 2. 텍스트 데이터 추가
    formData.append("title", form.title);
    formData.append("content", form.content);
    formData.append("category", form.category);

    if (file) {
      formData.append("file", file);
    }
    // 3. 파일 데이터 추가 (백엔드 NoticeFormDto의 필드 이름인 'file'로 매핑)
    if (file) {
      formData.append("file", file); // DTO의 필드명 'file'과 일치해야 함
    }

    try {
      if (noticeId) {
        await updateNotice(noticeId, formData);
      } else {
        await createNotice(formData);
      }
      onBack(); // 등록/수정 후 목록으로
    } catch (err) {
      console.error("공지 저장 실패:", err);
      showModal({
        type: "alert",
        message: "저장에 실패했습니다.",
      });
    }
  };

  return (
    <form className="change-password-form" onSubmit={handleSubmit}>
      <h2 className="notice-form__title">
        {noticeId ? "공지 수정" : "공지 등록"}
      </h2>

      <div className="notice-form__group">
        <label className="notice-form__label" htmlFor="category">
          말머리
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="notice-form__select"
        >
          <option value="[일반]">[일반]</option>
          <option value="[학사]">[학사]</option>
          <option value="[장학]">[장학]</option>
        </select>
      </div>

      <div className="notice-form__group">
        <label className="notice-form__label" htmlFor="title">
          제목
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="제목"
          className="notice-form__input"
        />
      </div>

      <div className="notice-form__group">
        <label className="notice-form__label" htmlFor="content">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="내용"
          className="notice-form__textarea"
        />
      </div>

      <div className="notice-form__group">
        <label className="notice-form__label" htmlFor="file">
          첨부 이미지
        </label>
        <input
          id="file"
          type="file"
          name="file"
          accept="image/*"
          onChange={handleFileChange}
          className="notice-form__file"
        />
      </div>

      <div className="notice-form__buttons">
        <button
          type="submit"
          className="notice-form__btn notice-form__btn--submit"
        >
          {noticeId ? "수정완료" : "등록"}
        </button>
        <button
          type="button"
          className="notice-form__btn notice-form__btn--cancel"
          onClick={onBack}
        >
          취소
        </button>
      </div>
    </form>
  );
};

export default NoticeForm;
