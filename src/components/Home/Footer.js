import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-left">
        <img src="logo.png" alt="누리대학교 로고" className="footer-logo" />
        <div className="logo-texts">
          <span className="kor">누리대학교</span>
          <span className="eng">Nuri University</span>
        </div>
        <div className="footer-github">
          <div className="contact-info">
            <a
              href="https://github.com/ddujeong"
              target="_blank"
              rel="noopener noreferrer"
              title="한수정 GitHub"
            >
              <FaGithub size={22} />
              <span>한수정</span>
            </a>
            <a
              href="https://github.com/Kukyeon"
              target="_blank"
              rel="noopener noreferrer"
              title="김국연 GitHub"
            >
              <FaGithub size={22} />
              <span>김국연</span>
            </a>

            <a
              href="https://github.com/LSM-1020"
              target="_blank"
              rel="noopener noreferrer"
              title="이상명 GitHub"
            >
              <FaGithub size={22} />
              <span>이상명</span>
            </a>
          </div>
        </div>
      </div>

      {/* <div className="footer-center">
        <Link to="/departments"></Link>
        <Link to="/admission">입학안내</Link>
        <Link to="/academicPage">공지사항</Link>
      </div> */}

      <div className="footer-right">
        <div className="contact-info">
          <p>서울특별시 마포구 신촌로 176</p>
          <p>02-313-1711</p>
          <p>COPYRIGHT© NURI UNIVERSITY. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
