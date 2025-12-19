import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import SectionLayout from "../components/Layout/SectionLayout";

import NoticePage from "../components/Notice-sch/NoticePage";
import "./AcademicPage.css";
import ScheduleManagerPage from "../components/Notice-sch/ScheduleManagerPage";
import AcademicCalendar from "../components/Notice-sch/AcademicCalendar";

const AcademicPage = ({ role }) => {
  const location = useLocation();
  const { state } = location;

  const [activeTab, setActiveTab] = useState(
    state?.view === "detail" && state?.noticeId
      ? "notice"
      : state?.view === "detail" && state?.scheduleId
      ? "calendar"
      : "notice"
  );

  const menuItems = [
    { key: "notice", label: "공지사항" },
    { key: "calendar", label: "학사일정" },
    ...(role === "staff"
      ? [{ key: "schedule-manager", label: "학사일정 관리" }]
      : []),
  ];

  const sidebar = (
    <ul className="section-menu">
      {menuItems.map((item) => (
        <li
          key={item.key}
          className={activeTab === item.key ? "active" : ""}
          onClick={() => setActiveTab(item.key)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );

  return (
    <SectionLayout title="학사 정보" sidebar={sidebar}>
      {activeTab === "notice" && <NoticePage role={role} />}
      {activeTab === "calendar" && <AcademicCalendar />}
      {activeTab === "schedule-manager" && role === "staff" && (
        <ScheduleManagerPage />
      )}
    </SectionLayout>
  );
};

export default AcademicPage;
