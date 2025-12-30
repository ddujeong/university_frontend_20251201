import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";

const CollegeTuition = () => {
  const [colleges, setColleges] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [form, setForm] = useState({
    collegeId: "",
    amount: "",
  });
  const { showModal } = useModal();
  useEffect(() => {
    getColleges();
  }, []);

  const getColleges = async () => {
    try {
      const res = await api.get("/admin/tuition");
      setColleges(res.data);
    } catch (err) {
      showModal({
        type: "alert",
        message: "단과대 목록을 불러오는데 실패했습니다.",
      });
    }
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    try {
      await api.post("/admin/tuition", form);
      showModal({
        type: "alert",
        message: "등록금을 등록하였습니다.",
      });
      setShowAddForm(false);
      setForm({ collegeId: "", amount: "" });
      getColleges();
    } catch (err) {
      showModal({
        type: "alert",
        message: "등록금 등록에 실패했습니다." || err.response?.data?.message,
      });
    }
  };

  const handleEdit = async () => {
    if (!form.collegeId)
      return showModal({
        type: "alert",
        message: "수정할 단과대를 선택해주세요.",
      });
    try {
      await api.put(`/admin/tuition`, form);
      showModal({
        type: "alert",
        message: "수정되었습니다.",
      });
      setShowEditForm(false);
      getColleges();
    } catch (err) {
      showModal({
        type: "alert",
        message: "수정에 실패하였습니다." || err.response?.data?.message,
      });
    }
  };

  const handleDelete = async (id, name) => {
    showModal({
      type: "confirm",
      message: `${name}의 등록금을 삭제 하시겠습니까?`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/tuition/${id}`);
          showModal({
            type: "alert",
            message: "등록금을 삭제하였습니다.",
          });
          getColleges();
        } catch (err) {
          showModal({
            type: "alert",
            message: "등록금 삭제에 실패하였습니다.",
          });
        }
      },
    });
  };

  const selectToEdit = (item) => {
    if (!item) return;
    setForm({
      collegeId: Number(item.collegeId),
      amount: item.amount || "",
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  return (
    <>
      <h3>단대별 등록금 관리</h3>

      <div className="form-row">
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
      </div>

      {/* 등록 폼 */}
      {showAddForm && (
        <div className="department-form">
          <select
            name="collegeId"
            value={form.collegeId}
            onChange={handleChange}
          >
            <option value="">단과대 선택</option>
            {colleges.map((d) => (
              <option key={d.collegeId} value={d.collegeId}>
                {d.collegeName} {d.amount == null ? "(미등록)" : ""}
              </option>
            ))}
          </select>
          <input
            name="amount"
            placeholder="등록금 입력"
            value={form.amount}
            onChange={handleChange}
          />
          <button onClick={handleAdd}>등록</button>
        </div>
      )}

      {/* 수정 폼 */}
      {showEditForm && (
        <div className="department-form">
          <select
            value={form.collegeId || ""}
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              const selectedCollege = colleges.find(
                (d) => d.collegeId === selectedId
              );
              if (selectedCollege) selectToEdit(selectedCollege);
            }}
          >
            <option value="">항목 선택</option>
            {colleges.map((d) => (
              <option key={d.collegeId} value={d.collegeId}>
                {d.collegeId} - {d.collegeName}
              </option>
            ))}
          </select>

          <input name="amount" value={form.amount} onChange={handleChange} />
          <button onClick={handleEdit}>수정</button>
        </div>
      )}

      {/* 테이블 */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>단과대</th>
              <th>등록금</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((d) => (
              <tr key={d.collegeId}>
                <td>{d.collegeId}</td>
                <td>{d.collegeName}</td>
                <td>
                  {d.amount != null
                    ? d.amount.toLocaleString() + "원"
                    : "미등록"}
                </td>
                <td>
                  {d.amount && (
                    <button
                      onClick={() => handleDelete(d.collegeId, d.collegeName)}
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CollegeTuition;
