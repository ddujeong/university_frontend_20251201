import React, { useEffect, useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";
import { useLocation } from "react-router-dom";
import ProfCourse from "../components/Course/ProfCourse";
import ProfEvaluation from "../components/Course/ProfEvalution";
import AllCourse from "../components/Course/AllCourse";
import "./CoursePage.css";
import ProfDashboard from "../components/Course/ProfDashboard";
const CoursePage = ({ role, user }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");
  // URL에 tab=danger가 있으면 "위험 학생 조회"를 기본값으로, 아니면 "전체 강의 조회"
  const getInitialTab = () => {
    if (tabParam === "danger") return "위험 학생 조회";
    if (tabParam === "mycourse") return "내 강의 조회";
    if (tabParam === "eval") return "내 강의 평가";
    return "전체 강의 조회";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const menuItems =
    role === "professor"
      ? ["전체 강의 조회", "내 강의 조회", "내 강의 평가", "위험 학생 조회"]
      : ["전체 강의 조회"];
  // 3. URL의 ?tab= 값 읽어오기 (없으면 null)

  useEffect(() => {
    if (tabParam === "danger") setActiveTab("위험 학생 조회");
    else if (tabParam === "mycourse") setActiveTab("내 강의 조회");
    else if (tabParam === "eval") setActiveTab("내 강의 평가");
    // tabParam이 없을 때는 굳이 "전체 강의 조회"로 강제 이동하지 않음 (사용자가 보고 있던 탭 유지)
  }, [tabParam]);

  /* ===== Sidebar ===== */
  const sidebar = (
    <ul className="section-menu">
      {menuItems.map((item) => (
        <li
          key={item}
          className={activeTab === item ? "active" : ""}
          onClick={() => setActiveTab(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <SectionLayout title="수업" sidebar={sidebar}>
      {activeTab === "전체 강의 조회" && <AllCourse role={role} user={user} />}

      {role === "professor" && (
        <>
          {activeTab === "내 강의 조회" && (
            <ProfCourse role={role} user={user} />
          )}
          {activeTab === "내 강의 평가" && <ProfEvaluation />}
          {activeTab === "위험 학생 조회" && <ProfDashboard user={user} />}
        </>
      )}
    </SectionLayout>
  );
};

export default CoursePage;
