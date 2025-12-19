import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";

const TuitionNotice = ({ user }) => {
  const [tuitionNotice, setTuitionNotice] = useState(null); // 단일 객체
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();
  useEffect(() => {
    const fetchTuitionNotice = async () => {
      try {
        const res = await api.get("/tuition/payment");
        setTuitionNotice(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.data?.message?.includes("휴학")) {
          setTuitionNotice({
            status: null,
            error: "현재 학기 휴학 중이므로 등록금 납부가 불가합니다.",
          });
        } else {
          setTuitionNotice({
            status: null,
            error: err.response?.data?.message,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTuitionNotice();
  }, [user.id]);
  const handleSubmit = async () => {
    showModal({
      type: "confirm",
      message: "등록금을 납부하시겠습니까?",
      onConfirm: async () => {
        try {
          await api.post("/tuition/payment");
          showModal({
            type: "alert",
            message: "등록금 납부가 완료되었습니다.",
          });
          const res = await api.get("/tuition/payment");
          setTuitionNotice(res.data);
        } catch (error) {
          showModal({
            type: "alert",
            message:
              error.response?.data?.message ||
              "등록금 납부 중 오류가 발생했습니다.",
          });
        }
      },
    });
  };
  if (loading) return <p>로딩 중...</p>;

  return (
    <>
      <h3>등록금 납부 고지서</h3>
      {tuitionNotice?.error ? (
        <p style={{ color: "red" }}>{tuitionNotice.error}</p>
      ) : tuitionNotice ? (
        <>
          <p>
            {tuitionNotice.tuiYear}년도 {tuitionNotice.semester}학기
          </p>
          <div className="table-wrapper">
            <table className="course-table">
              <tbody>
                <tr>
                  <td>단과대</td>
                  <td>
                    {tuitionNotice.student?.department?.college?.name || "-"}
                  </td>
                  <td>학과</td>
                  <td>{tuitionNotice.student?.department?.name || "-"}</td>
                </tr>
                <tr>
                  <td>학번</td>
                  <td>{tuitionNotice.student?.id || "-"}</td>
                  <td>성명</td>
                  <td>{tuitionNotice.student?.name || "-"}</td>
                </tr>
                <tr>
                  <td>장학유형</td>
                  <td>{tuitionNotice.scholarshipType?.type || "-"}</td>
                  <td>등록금</td>
                  <td>{tuitionNotice.tuiAmount?.toLocaleString() || 0}원</td>
                </tr>
                <tr>
                  <td>장학금</td>
                  <td>{tuitionNotice.schAmount?.toLocaleString() || 0}원</td>
                  <td>납부금</td>
                  <td>
                    {(
                      (tuitionNotice.tuiAmount || 0) -
                      (tuitionNotice.schAmount || 0)
                    ).toLocaleString()}
                    원
                  </td>
                </tr>
                <tr>
                  <td>납부계좌</td>
                  <td colSpan="3">그린은행 483-531345-536</td>
                </tr>
                <tr>
                  <td>납부기간</td>
                  <td colSpan="3">~ 2026.05.02</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "20px" }}>
            {tuitionNotice.status ? (
              <p style={{ color: "green", fontWeight: "bold" }}>
                이번 학기 등록금이 납부되었습니다.
              </p>
            ) : (
              <button onClick={handleSubmit}>납부</button>
            )}
          </div>
        </>
      ) : (
        <p>등록금 고지서 정보가 없습니다.</p>
      )}
    </>
  );
};

export default TuitionNotice;
