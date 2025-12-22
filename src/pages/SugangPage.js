import React, { useEffect, useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";
import CourseListPage from "../components/Sugang/CourseList";
import EnrollmentHistoryPage from "../components/Sugang/EnrollmentHistory";
import EnrollmentPage from "../components/Sugang/Enrollment";
import { useLocation } from "react-router-dom";

const Sugang = ({ role }) => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const menuItems = ["강의시간표조회", "수강신청", "수강 신청 내역 조회"];
  const [activeTab, setActiveTab] = useState(queryTab || menuItems[0]);
  const [pageHeader, setPageHeader] = useState(activeTab);

  useEffect(() => {
    if (!queryTab) {
      setActiveTab(menuItems[0]);
    }
  }, [role, queryTab]);
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
    <SectionLayout title="수강신청" sidebar={sidebar}>
      {activeTab === "강의시간표조회" && (
        <CourseListPage pageHeader={pageHeader} />
      )}

      {activeTab === "수강신청" && (
        <EnrollmentPage setPageHeader={setPageHeader} pageHeader={pageHeader} />
      )}

      {activeTab === "수강 신청 내역 조회" && (
        <EnrollmentHistoryPage
          setPageHeader={setPageHeader}
          setActiveTab={setActiveTab}
          pageHeader={pageHeader}
        />
      )}
    </SectionLayout>
  );
};

export default Sugang;
