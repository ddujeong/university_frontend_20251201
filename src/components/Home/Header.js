import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import HeaderTop from "./HeaderTop";
import "./Header.css";

const Header = ({ user, logout, role }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // ✅ 라우트 변경 시 상태 리셋
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { label: "홈", path: "/" },
    ...(user ? [{ label: "MY", path: "/my" }] : []),
    ...(role === "staff"
      ? [
          { label: "학사관리", path: "/academic" },
          { label: "등록", path: "/registration" },
          { label: "학사정보", path: "/academicPage" },
        ]
      : role === "professor"
      ? [
          { label: "수업", path: "/course" },
          { label: "상담", path: "/counseling" },
          { label: "학사정보", path: "/academicPage" },
        ]
      : role === "student"
      ? [
          { label: "수업", path: "/course" },
          { label: "수강", path: "/sugang" },
          { label: "성적", path: "/grade" },
          { label: "상담", path: "/counseling" },
          { label: "학사정보", path: "/academicPage" },
        ]
      : []),
    // { label: "회의", path: "/videoroom" }, // 모든 역할 공통으로 보이길 원하면 여기에
  ];

  return (
    <>
      <header>
        {user && <HeaderTop user={user} logout={logout} />}

        <div className="main-header">
          <div className="logo">
            <Link to="/">
              <img
                src="/logo.png"
                alt="NURI UNIVERSITY"
                style={{
                  height: "80px",
                  objectFit: "contain",
                }} /* 크기 조절 예시 */
              />
            </Link>
          </div>

          <nav className="nav-menu">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
            <span className="material-symbols-outlined">menu</span>
          </div>
        </div>
      </header>

      {/* 🔥 Portal + key로 강제 리마운트 */}
      {createPortal(
        <div
          key={location.pathname}
          className={`mobile-slide-menu ${mobileMenuOpen ? "open" : ""}`}
        >
          <button className="close-btn" onClick={closeMobileMenu}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link to={item.path} onClick={closeMobileMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

export default Header;
