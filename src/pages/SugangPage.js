import React, { use, useEffect, useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";
import CourseListPage from "../components/Sugang/CourseList";
import EnrollmentHistoryPage from "../components/Sugang/EnrollmentHistory";
import EnrollmentPage from "../components/Sugang/Enrollment";
import { useLocation } from "react-router-dom";
import { useModal } from "../components/ModalContext";

const Sugang = ({ role, user }) => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const isLeave = user?.currentStatus?.status === "휴학";
  const { showModal } = useModal();
  const menuItems = isLeave
    ? ["강의시간표조회"]
    : ["강의시간표조회", "수강신청", "수강 신청 내역 조회"];
  const [activeTab, setActiveTab] = useState(queryTab || menuItems[0]);
  const [pageHeader, setPageHeader] = useState(activeTab);
  useEffect(() => {
    if (!queryTab) {
      setActiveTab(menuItems[0]);
    }
  }, [role, queryTab]);
  useEffect(() => {
    // 휴학 상태인데, 현재 활성화된 탭이 '강의시간표조회'가 아닌 경우에만 실행
    if (isLeave && activeTab !== "강의시간표조회") {
      showModal({
        type: "alert",
        message: `${user.name}님은 현재 휴학 상태입니다. 휴학 중에는 수강 신청이 불가하며, 강의 시간표 조회만 가능합니다.`,
      });
      // 알림을 띄운 후 탭을 강제로 이동
      setActiveTab("강의시간표조회");
    }
  }, [isLeave, activeTab, user?.name, showModal]);
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
      {!isLeave && (
        <>
          {activeTab === "수강신청" && (
            <EnrollmentPage
              setPageHeader={setPageHeader}
              pageHeader={pageHeader}
            />
          )}

          {activeTab === "수강 신청 내역 조회" && (
            <EnrollmentHistoryPage
              setPageHeader={setPageHeader}
              setActiveTab={setActiveTab}
              pageHeader={pageHeader}
            />
          )}
        </>
      )}
      {isLeave && activeTab !== "강의시간표조회" && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 className="error-message">
            휴학 중에는 수강신청 기능을 이용할 수 없습니다.
          </h3>
        </div>
      )}
    </SectionLayout>
  );
};

export default Sugang;
