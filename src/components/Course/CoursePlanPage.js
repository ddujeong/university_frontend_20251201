import React, { useState, useEffect } from "react";
import { courseApi } from "../../api/gradeApi";
import { useModal } from "../ModalContext";
import api from "../../api/axiosConfig";

const CoursePlanPage = ({ user, role, show, onClose, subjectId }) => {
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({}); // 입력 폼 데이터
  const { showModal } = useModal();

  useEffect(() => {
    const loadData = async () => {
      if (!subjectId) return;
      try {
        const res = await courseApi.getSyllabus(subjectId);
        setSyllabus(res.data);
      } catch (err) {
        setSyllabus(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [subjectId]);
  if (!show) return null;

  if (loading) {
    return (
      <div className="break-modal-overlay">
        <div className="break-modal-content">로딩중...</div>
      </div>
    );
  }

  if (!syllabus) return null;
  const canEdit = () => {
    if (!syllabus || !user) return false;

    if (String(role).trim() !== "professor") {
      return false;
    }
    const myId = user.id || (user.user && user.user.id);
    const profId = syllabus.professorId; // 혹은 syllabus.professorid (소문자 주의)

    if (!myId || !profId) return false;

    return Number(myId) === Number(profId);
  };
  const handleEditClick = () => {
    setFormData({
      overview: syllabus.overview || "",
      objective: syllabus.objective || "",
      textbook: syllabus.textbook || "",
      program: syllabus.program || "",
    });
    setIsEditing(true);
  };
  const handleCancelClick = () => {
    showModal({
      type: "confirm",
      message: `수정을 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.`,
      onConfirm: async () => {
        setIsEditing(false);
      },
    });
  };

  // 4. 입력 값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // 5. 저장 버튼 클릭 시 (API 호출)
  const handleSaveClick = async () => {
    showModal({
      type: "confirm",
      message: `입력한 내용으로 강의계획서를 수정하시겠습니까?`,
      onConfirm: async () => {
        try {
          await api.put(`/prof/subject/${subjectId}/syllabus`, {
            ...syllabus, // 기존 정보(강의명, 시간 등) 유지
            ...formData, // 수정된 정보(개요, 목표 등) 덮어쓰기
          });
          showModal({
            type: "alert",
            message: "성공적으로 수정되었습니다.",
          });
          setSyllabus((prev) => ({ ...prev, ...formData }));
          setIsEditing(false);
        } catch (err) {
          showModal({
            type: "alert",
            message: err.response?.data || "수정 중 오류가 발생했습니다.",
          });
        }
      },
    });
  };

  return (
    <div className="break-modal-overlay">
      <div className="break-modal-content">
        {!isEditing && (
        <button className="break-modal-close" onClick={onClose}>
          ×
        </button>)}
        <h3>강의 계획서 조회</h3>
        <table className="break-modal-table">
          <tbody>
            <tr>
              <td>수업 번호</td>
              <td>{syllabus.subjectId}</td>
              <td>교과목 명</td>
              <td>{syllabus.name}</td>
            </tr>
            <tr>
              <td>수업 연도</td>
              <td>{syllabus.subYear}</td>
              <td>수업 학기</td>
              <td>{syllabus.semester}</td>
            </tr>
            <tr>
              <td>학점</td>
              <td>{syllabus.grades}</td>
              <td>이수 구분</td>
              <td>{syllabus.type}</td>
            </tr>
            <tr>
              <td>강의 시간</td>
              <td>
                {syllabus.subDay} {syllabus.startTime}:00 - {syllabus.endTime}
                :00
              </td>
              <td>강의실</td>
              <td>
                {syllabus.roomId} ({syllabus.collegeName})
              </td>
            </tr>
          </tbody>
        </table>
        <br />

        {/* === 테이블 2: 교강사 정보 === */}
        <table>
          <tbody>
            <tr>
              <td>소속</td>
              <td>{syllabus.deptName}</td>
              <td>성명</td>
              <td>{syllabus.professorName}</td>
            </tr>
            <tr>
              <td>연락처</td>
              <td>{syllabus.tel || "-"}</td>
              <td>email</td>
              <td>{syllabus.email || "-"}</td>
            </tr>
          </tbody>
        </table>
        <br />

        {/* === 테이블 3: 상세 정보 === */}
        <table>
          <tbody>
            <tr>
              <td>강의 개요</td>
              <td>
                {/* 줄바꿈 처리를 위해 pre-wrap 사용 */}
                {isEditing ? (
                  <textarea
                    name="overview"
                    value={formData.overview}
                    onChange={handleChange}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {syllabus.overview}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <td>강의 목표</td>
              <td>
                {isEditing ? (
                  <textarea
                    name="objective"
                    value={formData.objective}
                    onChange={handleChange}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {syllabus.objective}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <td>교재 정보</td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    name="textbook"
                    value={formData.textbook}
                    onChange={handleChange}
                  />
                ) : (
                  <div>{syllabus.textbook}</div>
                )}
              </td>
            </tr>
            <tr>
              <td>주간 계획</td>
              <td>
                {isEditing ? (
                  <textarea
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {syllabus.program}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 교수님일 경우 수정 버튼 표시 */}
        {canEdit() && (
          <div>
            {isEditing ? (
              <>
                <button onClick={handleSaveClick}>저장</button>
                <button onClick={handleCancelClick}>취소</button>
              </>
            ) : (
              <button onClick={handleEditClick}>수정하기</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlanPage;
