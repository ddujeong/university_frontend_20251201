import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-left">
        <h3>누리대학교</h3>
        <p>© 2025 All rights reserved.</p>
      </div>
      {/* <div className="footer-center">
        <Link to="/departments"></Link>
        <Link to="/admission">입학안내</Link>
        <Link to="/academicPage">공지사항</Link>
      </div> */}
      <div className="footer-right">
        <p>
          <strong>한수정</strong> :{" "}
          <a
            href="https://github.com/ddujeong"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/ddujeong
          </a>
        </p>
        <p>
          <strong>김국연</strong> :{" "}
          <a
            href="https://github.com/Kukyeon"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/Kukyeon
          </a>
        </p>
        <p>
          <strong>이상명</strong> :{" "}
          <a
            href="https://github.com/LSM-1020"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/LSM-1020
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
