import api from "./axiosConfig";

export const counselingApi = {
  checkEntry(scheduleId) {
    return api.get(`/schedules/entry-check/${scheduleId}`);
  },

  enterRoom(scheduleId) {
    return api.post(`/schedules/enter/${scheduleId}`);
  },

  completeConsultation(scheduleId) {
    return api.put(`/schedules/complete/${scheduleId}`);
  },
};
