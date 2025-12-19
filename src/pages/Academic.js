import React, { useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";

import StudentList from "../components/Academic/StudentList";
import ProfessorList from "../components/Academic/ProfessorList";
import StudentRegister from "../components/Academic/StudentRegister";
import ProfessorRegister from "../components/Academic/ProfessorRegister";
import StaffRegister from "../components/Academic/StaffRegister";
import TuitionNotice from "../components/Academic/TuitionNotice";
import BreakManagement from "../components/Academic/BreakManagement";
import CoursePeriod from "../components/Academic/CoursePeriod";
import "./Academic.css";
import AdminPage from "../components/Academic/AdminPage";

const Academic = ({ role }) => {
  const [activeTab, setActiveTab] = useState("studentList");

  const sidebar = (
    <ul className="section-menu">
      <li
        className={activeTab === "studentList" ? "active" : ""}
        onClick={() => setActiveTab("studentList")}
      >
        학생 명단 조회
      </li>
      <li
        className={activeTab === "professorList" ? "active" : ""}
        onClick={() => setActiveTab("professorList")}
      >
        교수 명단 조회
      </li>
      <li
        className={activeTab === "studentRegister" ? "active" : ""}
        onClick={() => setActiveTab("studentRegister")}
      >
        학생 등록
      </li>
      <li
        className={activeTab === "professorRegister" ? "active" : ""}
        onClick={() => setActiveTab("professorRegister")}
      >
        교수 등록
      </li>
      <li
        className={activeTab === "staffRegister" ? "active" : ""}
        onClick={() => setActiveTab("staffRegister")}
      >
        직원 등록
      </li>
      <li
        className={activeTab === "tuitionNotice" ? "active" : ""}
        onClick={() => setActiveTab("tuitionNotice")}
      >
        등록금 고지서 발송
      </li>
      <li
        className={activeTab === "breakManagement" ? "active" : ""}
        onClick={() => setActiveTab("breakManagement")}
      >
        휴학 처리
      </li>
      <li
        className={activeTab === "coursePeriod" ? "active" : ""}
        onClick={() => setActiveTab("coursePeriod")}
      >
        수강 신청 기간 설정
      </li>
      <li
        className={activeTab === "admin" ? "active" : ""}
        onClick={() => setActiveTab("admin")}
      >
        위험군 학생
      </li>
    </ul>
  );

  return (
    <SectionLayout title="학사관리" sidebar={sidebar}>
      {activeTab === "studentList" && <StudentList />}
      {activeTab === "professorList" && <ProfessorList />}
      {activeTab === "studentRegister" && <StudentRegister />}
      {activeTab === "professorRegister" && <ProfessorRegister />}
      {activeTab === "staffRegister" && <StaffRegister />}
      {activeTab === "tuitionNotice" && <TuitionNotice />}
      {activeTab === "breakManagement" && <BreakManagement role={role} />}
      {activeTab === "coursePeriod" && <CoursePeriod />}
      {activeTab === "admin" && <AdminPage />}
    </SectionLayout>
  );
};

export default Academic;
