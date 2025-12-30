import React, { useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";

import College from "../components/Registration/College";
import Department from "../components/Registration/Department";
import Classroom from "../components/Registration/ClassRoom";
import Course from "../components/Registration/Course";
import CollegeTuition from "../components/Registration/CollegeTuition";
import "./AcademicRegister.css";
import AdminDashboard from "../components/Registration/AdminDashboard";
const AcademicRegistration = () => {
  const [activeTab, setActiveTab] = useState("college");

  const menuItems = [
    { key: "college", label: "단과대학" },
    { key: "department", label: "학과" },
    { key: "classroom", label: "강의실" },
    { key: "course", label: "강의" },
    { key: "collegeTuition", label: "단대별 등록금" },
    { key: "dashBoard", label: "위험학생" },
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
    <SectionLayout title="등록 관리" sidebar={sidebar}>
      {activeTab === "college" && <College />}
      {activeTab === "department" && <Department />}
      {activeTab === "classroom" && <Classroom />}
      {activeTab === "course" && <Course />}
      {activeTab === "collegeTuition" && <CollegeTuition />}
      {activeTab === "dashBoard" && <AdminDashboard />}
    </SectionLayout>
  );
};

export default AcademicRegistration;
