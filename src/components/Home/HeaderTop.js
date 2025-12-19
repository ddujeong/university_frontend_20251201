import React from "react";
import "./Header.css";
const HeaderTop = ({ user, logout }) => {
  return (
    <div className="header-top">
      <ul>
        <li className="material-li">
          <span className="material-symbols-outlined">account_circle</span>
        </li>
        <li>
          {user.name} ({user.id})
        </li>
        <li className="divider">|</li>
        <li className="material-li">
          <span className="material-symbols-outlined logout-icon">logout</span>
        </li>
        <li>
          <button className="btn logout" onClick={logout}>
            로그아웃
          </button>
        </li>
      </ul>
    </div>
  );
};

export default HeaderTop;
