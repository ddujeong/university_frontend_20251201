import React, { useEffect, useState } from "react";
import "./MyPage.css";
import SectionLayout from "../components/Layout/SectionLayout";

import ChangePw from "../components/MyPage/ChangePw";
import MyInfo from "../components/MyPage/MyInfo";
import BreakApp from "../components/MyPage/BreakApp";
import BreakHistory from "../components/MyPage/BreakHistory";
import TuitionNotice from "../components/MyPage/TuitionNotice";
import TuitionHistory from "../components/MyPage/TuitionHistory";
import { useLocation } from "react-router-dom";

const MyPage = ({ user, role }) => {
  const location = useLocation();
  const tabFromQuery = new URLSearchParams(location.search).get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "myInfo");
  const [userData, setUserData] = useState({});

  useEffect(() => {
    if (user) {
      setUserData({ ...user });
    }
  }, [user]);

  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);
  if (!user) return <div>로그인 정보를 불러오는 중...</div>;

  /* ===== 사이드바 UI ===== */
  const sidebar = (
    <ul className="section-menu">
      <li
        className={activeTab === "myInfo" ? "active" : ""}
        onClick={() => setActiveTab("myInfo")}
      >
        내 정보 조회
      </li>
      <li
        className={activeTab === "changePw" ? "active" : ""}
        onClick={() => setActiveTab("changePw")}
      >
        비밀번호 변경
      </li>

      {role === "student" && (
        <>
          <li
            className={activeTab === "leave" ? "active" : ""}
            onClick={() => setActiveTab("leave")}
          >
            휴학 신청
          </li>
          <li
            className={activeTab === "leaveHistory" ? "active" : ""}
            onClick={() => setActiveTab("leaveHistory")}
          >
            휴학 내역 조회
          </li>
          <li
            className={activeTab === "tuitionHistory" ? "active" : ""}
            onClick={() => setActiveTab("tuitionHistory")}
          >
            등록금 내역 조회
          </li>
          <li
            className={activeTab === "tuitionNotice" ? "active" : ""}
            onClick={() => setActiveTab("tuitionNotice")}
          >
            등록금 납부 고지서
          </li>
        </>
      )}
    </ul>
  );

  return (
    <SectionLayout title="MY" sidebar={sidebar}>
      {activeTab === "myInfo" && (
        <MyInfo
          user={user}
          userData={userData}
          setUserData={setUserData}
          role={role}
        />
      )}
      {activeTab === "changePw" && <ChangePw user={user} />}
      {activeTab === "leave" && <BreakApp user={user} />}
      {activeTab === "leaveHistory" && <BreakHistory user={user} role={role} />}
      {activeTab === "tuitionHistory" && <TuitionHistory user={user} />}
      {activeTab === "tuitionNotice" && <TuitionNotice user={user} />}
    </SectionLayout>
  );
};

export default MyPage;
