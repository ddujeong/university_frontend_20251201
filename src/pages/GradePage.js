import React, { useState, useEffect } from "react";
import SectionLayout from "../components/Layout/SectionLayout";

import GradeThisSemester from "../components/Grade/GradeThisSemester";
import GradeBySemester from "../components/Grade/GradeBySemester";
import GradeTotal from "../components/Grade/GradeTotal";
import Modal from "../components/Modal";
import api from "../api/axiosConfig";
import { useModal } from "../components/ModalContext";
import EvaluationForm from "../components/Grade/EvaluationForm";
import { useLocation } from "react-router-dom";

const GradePage = () => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const [activeTab, setActiveTab] = useState(queryTab || "this"); // 기본 this
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();
  const [selectedEval, setSelectedEval] = useState(null);
  const [year, setYear] = useState(2025);
  const [semester, setSemester] = useState(1);
  const [type, setType] = useState("");

  const menuItems = [
    { key: "this", label: "금학기 성적 조회" },
    { key: "semester", label: "학기별 성적 조회" },
    { key: "total", label: "누계 성적" },
  ];

  const openEvalModal = (grade) => {
    setSelectedEval(grade);
  };

  const closeEvalModal = () => {
    setSelectedEval(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let res;

      if (activeTab === "this") {
        res = await api.get("/grade/thisSemester", {
          params: { year: 2025, semester: 1 },
        });
      } else if (activeTab === "semester") {
        res = await api.get("/grade/semester", {
          params: { year, semester, type },
        });
      } else if (activeTab === "total") {
        res = await api.get("/grade/total");
      }

      if (res?.status === 200) {
        setData({
          gradeList: res.data.gradeList ?? [],
          mygradeList: res.data.mygradeList ?? [],
        });
      } else {
        setData({ gradeList: [], mygradeList: [] });
      }
    } catch (err) {
      showModal({
        type: "alert",
        message: err.response?.data?.message || err.message,
      });
      setData({ gradeList: [], mygradeList: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, year, semester, type]);

  /* ===== Sidebar ===== */
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
    <SectionLayout title="성적" sidebar={sidebar}>
      <h3 style={{ marginBottom: "20px" }}>
        {menuItems.find((m) => m.key === activeTab).label}
      </h3>

      {loading && <div className="loading-text">로딩중...</div>}

      {selectedEval && (
        <Modal onClose={closeEvalModal}>
          <EvaluationForm
            evaluationId={0}
            subjectId={selectedEval.subjectId}
            onSubmit={() => {
              closeEvalModal();
              loadData();
            }}
          />
        </Modal>
      )}

      {!loading && data && (
        <>
          {activeTab === "this" && (
            <GradeThisSemester data={data} onEvaluate={openEvalModal} />
          )}

          {activeTab === "semester" && (
            <>
              <div className="department-form">
                <select value={year} onChange={(e) => setYear(+e.target.value)}>
                  <option value="2023">2023년</option>
                  <option value="2024">2024년</option>
                  <option value="2025">2025년</option>
                </select>

                <select
                  value={semester}
                  onChange={(e) => setSemester(+e.target.value)}
                >
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>

                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">전체</option>
                  <option value="전공">전공</option>
                  <option value="교양">교양</option>
                </select>

                <button onClick={loadData}>조회</button>
              </div>

              <GradeBySemester data={data} />
            </>
          )}

          {activeTab === "total" && <GradeTotal data={data} />}
        </>
      )}
    </SectionLayout>
  );
};

export default GradePage;
