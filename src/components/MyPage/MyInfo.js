import { useState } from "react";
import api from "../../api/axiosConfig";
import { useModal } from "../ModalContext";

const MyInfo = ({ user, userData, setUserData, role }) => {
  const [editMode, setEditMode] = useState(false);
  const { showModal } = useModal();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSave = async () => {
    try {
      const res = await api.put("/user/update", userData);
      setEditMode(false);
      setUserData(res.data);
      showModal({
        type: "alert",
        message: "수정완료",
      });
    } catch (err) {
      showModal({
        type: "alert",
        message: err.response?.data?.message || err.message,
      });
    }
  };
  const combinedChanges = [
    ...(userData?.statList?.map((stat) => ({
      date: stat.fromDate,
      type: stat.status,
      detail:
        stat.status === "휴학"
          ? userData.breakApps.find((b) => b.id === stat.breakAppId)?.type
          : "",
      approval:
        stat.status === "재학"
          ? "승인"
          : userData.breakApps.find((b) => b.id === stat.breakAppId)?.status,
      returnSemester:
        stat.status === "휴학"
          ? (() => {
              const b = userData.breakApps.find(
                (b) => b.id === stat.breakAppId
              );
              return b ? `${b.toYear}년 ${b.toSemester}학기` : "-";
            })()
          : "-",
    })) || []),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const renderInput = (field, value) =>
    editMode ? (
      <input
        name={field}
        value={value || ""}
        required
        onChange={handleChange}
      />
    ) : (
      value
    );

  const renderStudentInfo = () => (
    <>
      <tr>
        <td>학번</td>
        <td>{userData?.id}</td>
        <td>소속</td>
        <td>{userData?.department?.name}</td>
      </tr>
      <tr>
        <td>학년</td>
        <td>{userData?.grade}</td>
        <td>학기</td>
        <td>{userData?.semester}</td>
      </tr>
      <tr>
        <td>입학일</td>
        <td>{userData?.entranceDate}</td>
        <td>졸업(예정)일</td>
        <td>{userData?.graduationDate || "-"}</td>
      </tr>
      <tr>
        <td>이름</td>
        <td>{userData?.name}</td>
        <td>생년월일</td>
        <td>{userData?.birthDate}</td>
      </tr>
      <tr>
        <td>성별</td>
        <td>{userData?.gender}</td>
        <td>이메일</td>
        <td>{renderInput("email", userData?.email)}</td>
      </tr>
      <tr>
        <td>연락처</td>
        <td>{renderInput("tel", userData?.tel)}</td>
        <td>주소</td>
        <td>{renderInput("address", userData?.address)}</td>
      </tr>
    </>
  );

  const renderProfessorInfo = () => (
    <>
      <tr>
        <td>ID</td>
        <td>{userData?.id}</td>
        <td>소속</td>
        <td>
          {userData?.department?.college.name} {userData?.department?.name}
        </td>
      </tr>
      <tr>
        <td>성명</td>
        <td>{userData?.name}</td>
        <td>생년월일</td>
        <td>{userData?.birthDate}</td>
      </tr>
      <tr>
        <td>성별</td>
        <td>{userData?.gender}</td>
        <td>주소</td>
        <td>{renderInput("address", userData?.address)}</td>
      </tr>
      <tr>
        <td>연락처</td>
        <td>{renderInput("tel", userData?.tel)}</td>
        <td>이메일</td>
        <td>{renderInput("email", userData?.email)}</td>
      </tr>
    </>
  );

  const renderStaffInfo = () => (
    <>
      <tr>
        <td>ID</td>
        <td>{userData?.id}</td>
        <td>입사일</td>
        <td>{renderInput("hireDate", userData?.hireDate)}</td>
      </tr>
      <tr>
        <td>성명</td>
        <td>{userData?.name}</td>
        <td>생년월일</td>
        <td>{userData?.birthDate}</td>
      </tr>
      <tr>
        <td>성별</td>
        <td>{userData?.gender}</td>
        <td>주소</td>
        <td>{renderInput("address", userData?.address)}</td>
      </tr>
      <tr>
        <td>이메일</td>
        <td>{renderInput("email", userData?.email)}</td>
        <td>연락처</td>
        <td>{renderInput("tel", userData?.tel)}</td>
      </tr>
    </>
  );

  return (
    <>
      <h3>내 정보 조회</h3>
      <div className="table-wrapper">
        <table className="course-table">
          <tbody>
            {role === "student" && renderStudentInfo()}
            {role === "professor" && renderProfessorInfo()}
            {role === "staff" && renderStaffInfo()}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px" }}>
        {editMode ? (
          <>
            <button onClick={handleSave}>저장</button>
            <button onClick={() => setEditMode(false)}>취소</button>
          </>
        ) : (
          <button onClick={() => setEditMode(true)}>수정</button>
        )}
      </div>

      {role === "student" && (
        <>
          <h3>학적 변동 내역</h3>
          <div className="table-wrapper">
            <table className="course-table">
              <thead>
                <tr>
                  <th>변동 일자</th>
                  <th>변동 구분</th>
                  <th>세부</th>
                  <th>승인 여부</th>
                  <th>복학 예정 연도/학기</th>
                </tr>
              </thead>
              <tbody>
                {combinedChanges.length > 0 ? (
                  combinedChanges.map((change, idx) => (
                    <tr key={idx}>
                      <td>{change.date}</td>
                      <td>{change.type}</td>
                      <td>{change.detail}</td>
                      <td>{change.approval}</td>
                      <td>{change.returnSemester}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      학적 변동 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

export default MyInfo;
