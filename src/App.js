import "./App.css";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import AcademicPage from "./pages/AcademicPage";
import Academic from "./pages/Academic";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyPage from "./pages/MyPage";
import { useEffect, useState } from "react";
import api from "./api/axiosConfig";
import ProtectedRoute from "./components/ProtectedRoute";

import AcademicRegistration from "./pages/AcademicRegistration";
import GradePage from "./pages/GradePage";
import CoursePage from "./pages/CoursePage";
import SugangPage from "./pages/SugangPage";
import MainLayout from "./components/Layout/MainLayout";
import { ModalProvider } from "./components/ModalContext";
import CounselingPage from "./pages/CounselingPage";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null); // 즉시 로그아웃 상태로 전환
    setRole(null); // ← role 초기화
    navigate("/login");
  };
  useEffect(() => {
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    api
      .get("/user/me")
      .then((res) => {
        setUser(res.data.user);
        setRole(res.data.role);
      })
      .catch(() => {
        setUser(null);
        setRole(null);
        localStorage.removeItem("token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);
  if (loading) return <div>로딩중..</div>;
  return (
    <ModalProvider>
      {" "}
      <div className="App">
        <Routes>
          <Route
            element={
              <ProtectedRoute user={user} role={role}>
                <MainLayout user={user} role={role} logout={logout} />
              </ProtectedRoute>
            }
          >
            {/* 홈 */}
            <Route
              path="/"
              element={
                <ProtectedRoute user={user}>
                  <Home user={user} logout={logout} role={role} />
                </ProtectedRoute>
              }
            />
            {/* MY */}
            <Route
              path="/My"
              element={
                <ProtectedRoute user={user} role={role}>
                  <MyPage user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 학사관리  */}
            <Route
              path="/academic"
              element={
                <ProtectedRoute user={user} role={role} roleRequired="staff">
                  <Academic user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 수업 */}
            <Route
              path="/course"
              element={
                <ProtectedRoute user={user} role={role}>
                  <CoursePage user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 수강 */}
            <Route
              path="/sugang"
              element={
                <ProtectedRoute user={user} role={role} roleRequired="student">
                  <SugangPage user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 상담 */}
            <Route
              path="/counseling"
              element={
                <ProtectedRoute user={user} role={role}>
                  <CounselingPage user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 등록 */}
            <Route
              path="/registration"
              element={
                <ProtectedRoute user={user} role={role} roleRequired="staff">
                  <AcademicRegistration user={user} role={role} />
                </ProtectedRoute>
              }
            />
            {/* 학사정보 */}
            <Route
              path="/academicPage"
              element={
                <ProtectedRoute user={user} role={role}>
                  <AcademicPage role={role} />
                </ProtectedRoute>
              }
            />
            {/* 없는 경로는 home으로 redirect */}
            {/* 성적 */}
            <Route
              path="/grade"
              element={
                <ProtectedRoute user={user} role={role} roleRequired="student">
                  <GradePage user={user} role={role} />
                </ProtectedRoute>
              }
            />
          </Route>
          {/* 없는 경로 홈 이동 */}
          <Route path="*" element={<Navigate to="/" />} />
          {/* 로그인 */}
          <Route
            path="/login"
            element={<Login setUser={setUser} setRole={setRole} />}
          />
        </Routes>
      </div>
    </ModalProvider>
  );
}

export default App;
