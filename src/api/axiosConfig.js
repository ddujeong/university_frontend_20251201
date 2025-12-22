import axios from "axios";

// 기본 Axios 인스턴스
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8888/api", // 백엔드 기본 URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 세션 인증이 필요할 경우
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // 여기서 자동으로 가져옴
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default api;
