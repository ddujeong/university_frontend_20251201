import api from "./axiosConfig";

// [학생용] 챗봇 & 추천
export const chatApi = {
  // 질문하기
  ask: (studentId, question) =>
    api.post("/chatbot/ask", { studentId, question }),

  // 대화 이력 가져오기
  getHistory: (studentId) => api.get(`/chatbot/history?studentId=${studentId}`),

  // 강의 추천 받기
  getRecommendation: (studentId) =>
    api.get(`/course/recommend?studentId=${studentId}`),

  //대화 종료하기
  clearHistory: (studentId) =>
    api.delete(`/chatbot/history?studentId=${studentId}`),
};

// [교수용] 대시보드
export const dashboardApi = {
  // 위험 학생 리스트 조회
  getRiskList: (professorId) =>
    api.get(`/dashboard/risk-list?professorId=${professorId}`),

  deleteRisk: (id) => api.delete(`/dashboard/risk/${id}`),

  getAllRiskList: () => api.get("/dashboard/admin/risk-list"),
};

// [관리자용] 시스템 제어
export const adminApi = {
  // 중도이탈 분석 실행
  runAnalysis: () => api.post("/dropout/analyze"),

  // 데이터 동기화 실행
  syncData: () => api.post("/system/sync"),

  getLogs: () => api.get("/system/logs"),

  clearLogs: () => api.delete("/system/logs"),
};

export const notiApi = {
  // 내 알림 가져오기
  getMyNotifications: () => api.get("/notification/my"),

  // 알림 읽음 처리
  markAsRead: (id) => api.put(`/notification/${id}/read`),

  // [추가] 알림 삭제
  deleteNotification: (id) => api.delete(`/notification/${id}`),

  // 교수 -> 학생 알림 보내기
  sendDirectMessage: (targetStudentId, content) =>
    api.post("/notification/send-direct", { targetStudentId, content }),
};
