import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";

const TuitionHistory = ({ user }) => {
  const [tuitionHistory, setTuitionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();
  useEffect(() => {
    const fetchTuitionHistory = async () => {
      try {
        const res = await api.get("/tuition/me");
        setTuitionHistory(res.data); // 백엔드에서 내려주는 리스트
      } catch (err) {
        console.error(err);
        showModal({
          type: "alert",
          message: "등록금 내역을 불러오는 중 오류가 발생했습니다.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTuitionHistory();
  }, [user.id]);
  return (
    <>
      <h3>등록금 내역 조회</h3>
      {tuitionHistory && tuitionHistory.length > 0 ? (
        <div className="table-wrapper">
          <table className="course-table">
            <thead>
              <tr>
                <th>등록연도</th>
                <th>등록학기</th>
                <th>장학금 유형</th>
                <th>등록금</th>
                <th>장학금</th>
                <th>납입금</th>
              </tr>
            </thead>
            <tbody>
              {tuitionHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.tuiYear}</td>
                  <td>{item.semester}</td>
                  <td>{item.scholarshipType?.type}유형</td>
                  <td>{item.tuiAmount}원</td>
                  <td>{item.schAmount}원</td>
                  <td>{item.tuiAmount - item.schAmount}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>등록금 납부 내역이 없습니다.</p>
      )}
    </>
  );
};

export default TuitionHistory;
