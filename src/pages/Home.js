import React, { useEffect, useState } from "react";
import Hero from "../components/Home/Hero";
import Notice from "../components/Home/Notice";
import Schedule from "../components/Home/Schedule";
import StudentInfo from "../components/Home/StudentInfo";
import "../components/Home/Home.css";
import { useLocation } from "react-router-dom";
import { useModal } from "../components/ModalContext";

const Home = ({ user, logout, role }) => {
  const location = useLocation();
  const { showModal } = useModal();

  useEffect(() => {
    const hasAuthError = location.state?.authError;

    if (hasAuthError) {
      window.history.replaceState({}, document.title);

      showModal({
        type: "alert",
        message: "접근 권한이 없습니다. 관리자에게 문의하세요.",
      });
    }
  }, [location.state]);

  return (
    <div className="home">
      <Hero />

      <div className="home__cards">
        {user && <StudentInfo user={user} role={role} logout={logout} />}
        <Notice />
        <Schedule />
      </div>
    </div>
  );
};

export default Home;
