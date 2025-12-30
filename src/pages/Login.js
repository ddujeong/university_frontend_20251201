import React, { useEffect, useState } from "react";
import "./Login.css";
import Modal from "../components/Modal"; // 모달 컴포넌트
import api from "../api/axiosConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { useModal } from "../components/ModalContext";

const LoginPage = ({ setUser, setRole }) => {
  const [openModal, setOpenModal] = useState(null);
  const [loginData, setLoginData] = useState({
    id: localStorage.getItem("savedLoginId") || "",
    password: "",
    rememberId: false,
  });
  const [modalData, setModalData] = useState({
    name: "",
    email: "",
    userId: "",
    role: "student",
  });
  const [errors, setErrors] = useState({
    id: "",
    password: "",
  });

  const [tempPassword, setTempPassword] = useState("");
  const [foundId, setFoundId] = useState(""); // 새 상태
  const navigate = useNavigate();
  // 입력값 변경 핸들러
  const [saveId, setSaveId] = useState(() => {
    return localStorage.getItem("savedLoginId") ? true : false;
  });
  const location = useLocation();
  const { showModal } = useModal();

  useEffect(() => {
    if (location.state?.fromExpired) {
      showModal({
        type: "alert",
        message: "세션이 만료되었습니다. 다시 로그인해주세요.",
      });
    }
    if (location.state?.fromLogout) {
      showModal({ type: "alert", message: "로그아웃 되셨습니다." });
    }
    // state 청소
    window.history.replaceState({}, document.title);
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFindId = async () => {
    try {
      const response = await api.post("/user/findId", {
        name: modalData.name,
        email: modalData.email,
        userRole: modalData.role,
      });
      setFoundId(response.data.id);
    } catch (err) {
      showModal({
        type: "alert",
        message: err.response?.data?.message || err.message,
      });
    }
  };

  const handleFindPw = async () => {
    try {
      const response = await api.post("/user/findPw", {
        name: modalData.name,
        email: modalData.email,
        id: parseInt(modalData.userId, 10),
        userRole: modalData.role,
      });
      setTempPassword(response.data.tempPassword);
    } catch (err) {
      console.error(
        "임시 비밀번호 발급 실패:",
        err.response?.data || err.message
      );
      showModal({
        type: "alert",
        message: err.response?.data?.message || err.message,
      });
    }
  };
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); // 새로고침 방지
    let valid = true;
    const newErrors = { id: "", password: "" };
    if (!loginData.id) {
      newErrors.id = "아이디를 입력해주세요.";
      valid = false;
    }

    if (!loginData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return; // 입력 오류 있으면 서버 요청 막기
    try {
      const response = await api.post("/user/login", {
        id: parseInt(loginData.id, 10),
        password: loginData.password,
      });
      const { token, user, role } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      setRole(role);
      if (saveId) {
        localStorage.setItem("savedLoginId", loginData.id);
      } else {
        localStorage.removeItem("savedLoginId");
      }
      showModal({
        type: "alert",
        message: "로그인 성공!",
      });
      navigate("/");
      // 로그인 성공 후 처리
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "아이디 또는 비밀번호가 올바르지 않습니다.";
      setErrors((prev) => ({ ...prev, password: message }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img
          src="/logo.png"
          style={{
            height: "100px",
            objectFit: "contain",
          }}
        />

        <form className="login-form" onSubmit={handleLoginSubmit}>
          <div className="input-group">
            <label>아이디</label>
            <input
              type="text"
              name="id"
              placeholder="아이디를 입력하세요"
              value={loginData.id}
              onChange={handleLoginChange}
            />
            {errors.id && <div className="error-message">{errors.id}</div>}
          </div>
          <div className="input-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              value={loginData.password}
              onChange={handleLoginChange}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="checkbox-group">
            <label className="saveId">
              <input
                type="checkbox"
                checked={saveId}
                onChange={(e) => setSaveId(e.target.checked)}
              />
              아이디 저장
            </label>
          </div>

          <button type="submit" className="login-btn">
            로그인
          </button>

          <div className="login-links">
            <button type="button" onClick={() => setOpenModal("findId")}>
              아이디 찾기
            </button>
            <span>|</span>
            <button type="button" onClick={() => setOpenModal("findPw")}>
              비밀번호 찾기
            </button>
          </div>
        </form>
      </div>

      {/* 아이디 찾기 모달 */}
      {openModal === "findId" && (
        <Modal
          onClose={() => {
            setOpenModal(null); // 모달 닫기
            setModalData({ name: "", email: "", userId: "", role: "student" }); // 초기화
            setFoundId(""); // 조회 결과 초기화
          }}
        >
          <h3>아이디 찾기</h3>
          <input
            className="modal-input"
            placeholder="이름"
            name="name"
            value={modalData.name}
            onChange={handleChange}
          />
          <input
            className="modal-input"
            placeholder="이메일"
            name="email"
            value={modalData.email}
            onChange={handleChange}
          />
          <div className="role-checkboxes">
            {["student", "professor", "staff"].map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={modalData.role === r}
                  onChange={handleChange}
                />{" "}
                {r === "student" ? "학생" : r === "professor" ? "교수" : "직원"}
              </label>
            ))}
          </div>
          <button className="modal-btn" onClick={handleFindId}>
            조회
          </button>
          {foundId && (
            <div className="found-id-display">
              조회된 ID: <strong>{foundId}</strong>
            </div>
          )}
        </Modal>
      )}

      {/* 비밀번호 찾기 모달 */}
      {openModal === "findPw" && (
        <Modal
          onClose={() => {
            setOpenModal(null); // 모달 닫기
            setModalData({ name: "", email: "", userId: "", role: "student" }); // 초기화
            setTempPassword(""); // 조회 결과 초기화
          }}
        >
          <h3>비밀번호 찾기</h3>
          <input
            className="modal-input"
            placeholder="이름"
            name="name"
            value={modalData.name}
            onChange={handleChange}
          />
          <input
            className="modal-input"
            placeholder="아이디"
            name="userId"
            value={modalData.userId}
            onChange={handleChange}
          />
          <input
            className="modal-input"
            placeholder="이메일"
            name="email"
            value={modalData.email}
            onChange={handleChange}
          />
          <div className="role-checkboxes">
            {["student", "professor", "staff"].map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={modalData.role === r}
                  onChange={handleChange}
                />{" "}
                {r === "student" ? "학생" : r === "professor" ? "교수" : "직원"}
              </label>
            ))}
          </div>
          <button className="modal-btn" onClick={handleFindPw}>
            임시 비밀번호 발급
          </button>
          {tempPassword && (
            <div className="temp-password-display">
              임시 비밀번호: <strong>{tempPassword}</strong>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;
