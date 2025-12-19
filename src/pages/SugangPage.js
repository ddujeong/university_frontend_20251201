import React, { useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";
import CourseListPage from "../components/Sugang/CourseList";
import EnrollmentHistoryPage from "../components/Sugang/EnrollmentHistory";
import EnrollmentTable from "../components/Sugang/EnrollmentTable";
import EnrollmentPage from "../components/Sugang/Enrollment";

const Sugang = ({ role }) => {
  const [activeTab, setActiveTab] = useState("강의 시간표 조회");
  const [pageHeader, setPageHeader] = useState(activeTab);
  const menuItems = ["강의 시간표 조회", "수강 신청", "수강 신청 내역 조회"];

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
      {activeTab === "강의 시간표 조회" && (
        <CourseListPage pageHeader={pageHeader} />
      )}

      {activeTab === "수강 신청" && (
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
