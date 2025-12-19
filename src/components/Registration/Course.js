import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";

/** 🔽 공통 폼 */
const CourseForm = ({
  onSubmit,
  isEdit,
  form,
  handleChange,
  subjects,
  selectSubjectToEdit,
}) => (
  <div className="course-form">
    {isEdit && (
      <div className="form-field full">
        <label>강의 선택</label>
        <select
          value={form.id}
          onChange={(e) =>
            selectSubjectToEdit(
              subjects.find((s) => s.id === Number(e.target.value))
            )
          }
        >
          <option value="">강의 선택</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} - {s.name}
            </option>
          ))}
        </select>
      </div>
    )}

    <div className="form-grid">
      <div className="form-field">
        <label>강의명</label>
        <input name="name" value={form.name} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label>교수 ID</label>
        <input
          name="professorId"
          value={form.professorId}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label>강의실 ID</label>
        <input name="roomId" value={form.roomId} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label>학과 ID</label>
        <input name="deptId" value={form.deptId} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label>구분</label>
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="">선택</option>
          <option value="전공">전공</option>
          <option value="교양">교양</option>
        </select>
      </div>

      <div className="form-field">
        <label>연도 / 학기</label>
        <div className="inline">
          <input
            name="subYear"
            placeholder="연도"
            value={form.subYear}
            onChange={handleChange}
          />
          <input
            name="semester"
            placeholder="학기"
            value={form.semester}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-field">
        <label>요일</label>
        <select name="subDay" value={form.subDay} onChange={handleChange}>
          <option value="">선택</option>
          <option value="월">월</option>
          <option value="화">화</option>
          <option value="수">수</option>
          <option value="목">목</option>
          <option value="금">금</option>
        </select>
      </div>

      <div className="form-field">
        <label>시간</label>
        <div className="inline">
          <input
            name="startTime"
            placeholder="시작"
            onChange={handleChange}
            value={form.startTime}
            type="number"
          />
          <input
            name="endTime"
            placeholder="종료"
            value={form.endTime}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-field">
        <label>학점</label>
        <input name="grades" value={form.grades} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label>정원</label>
        <input name="capacity" value={form.capacity} onChange={handleChange} />
      </div>
    </div>

    <div className="form-actions">
      <button className="primary-btn" onClick={onSubmit}>
        {isEdit ? "수정" : "등록"}
      </button>
    </div>
  </div>
);

const Course = () => {
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { showModal } = useModal();

  const [form, setForm] = useState({
    id: "",
    name: "",
    professorId: "",
    roomId: "",
    deptId: "",
    type: "",
    subYear: "",
    semester: "",
    subDay: "",
    startTime: "",
    endTime: "",
    grades: "",
    capacity: "",
  });

  useEffect(() => {
    getSubjects();
  }, [page]);
  // showAddForm이나 showEditForm 상태가 바뀔 때마다 폼을 리셋
  useEffect(() => {
    resetForm();
  }, [showAddForm, showEditForm]);

  const getSubjects = async () => {
    try {
      const res = await api.get("/admin/subject", { params: { page } });
      if (res.data && res.data.content) {
        setSubjects(res.data.content); // 목록 세팅
        setTotalPages(res.data.totalPages); // 전체 페이지 수 세팅
      } else {
        setSubjects([]);
        setTotalPages(0);
      }
    } catch {
      showModal({ type: "alert", message: "강의 목록 조회 실패" });
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      professorId: "",
      roomId: "",
      deptId: "",
      type: "",
      subYear: "",
      semester: "",
      subDay: "",
      startTime: "",
      endTime: "",
      grades: "",
      capacity: "",
    });
  };

  const handleAdd = async () => {
    try {
      await api.post("/admin/subject", form);
      showModal({ type: "alert", message: "강의 등록 완료" });
      resetForm();
      setShowAddForm(false);
      getSubjects();
    } catch {
      showModal({ type: "alert", message: "강의 등록 실패" });
    }
  };

  const handleEdit = async () => {
    try {
      await api.put(`/admin/subject/${form.id}`, form);
      showModal({ type: "alert", message: "수정 완료" });
      setShowEditForm(false);
      getSubjects();
    } catch {
      showModal({ type: "alert", message: "수정 실패" });
    }
  };

  const handleDelete = (id, name) => {
    showModal({
      type: "confirm",
      message: `${name} 강의를 삭제하시겠습니까?`,
      onConfirm: async () => {
        await api.delete(`/admin/subject/${id}`);
        getSubjects();
      },
    });
  };

  const selectSubjectToEdit = (sub) => {
    setForm({ ...sub });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  return (
    <div>
      <h3>강의 관리</h3>

      <button
        onClick={() => {
          setShowAddForm(!showAddForm);
          setShowEditForm(false);
        }}
      >
        등록
      </button>
      <button
        onClick={() => {
          setShowEditForm(!showEditForm);
          setShowAddForm(false);
        }}
      >
        수정
      </button>

      {showAddForm && (
        <CourseForm
          onSubmit={handleAdd}
          form={form}
          handleChange={handleChange}
        />
      )}
      {showEditForm && (
        <CourseForm
          onSubmit={handleEdit}
          isEdit
          form={form}
          handleChange={handleChange}
          subjects={subjects}
          selectSubjectToEdit={selectSubjectToEdit}
        />
      )}

      {/* 목록 테이블은 유지 */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>강의명</th>
              <th>교수</th>
              <th>강의실</th>
              <th>학과</th>
              <th>구분</th>
              <th>연도</th>
              <th>학기</th>
              <th>시간</th>
              <th>학점</th>
              <th>정원</th>
              <th>신청인원</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.professorId}</td>
                <td>{s.roomId}</td>
                <td>{s.deptId}</td>
                <td>{s.type}</td>
                <td>{s.subYear}</td>
                <td>{s.semester}</td>
                <td>
                  {s.subDay} {s.startTime}:00 ~ {s.endTime}:00
                </td>
                <td>{s.grades}</td>
                <td>{s.capacity}</td>
                <td>{s.numOfStudent}</td>
                <td>
                  <button onClick={() => handleDelete(s.id, s.name)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Course;
