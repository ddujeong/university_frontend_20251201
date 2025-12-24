import { useEffect, useState } from "react";
import SectionLayout from "../components/Layout/SectionLayout";
import BookAppointment from "../components/Counseling/BookAppointment";
import StudentScheduleList from "../components/Counseling/StudentScheduleList";
import VideoRoom from "../components/Counseling/VideoRoom";
import ProfessorAvailabilityManager from "../components/Counseling/ProfessorAvailabilityManager";
import ProfessorScheduleList from "../components/Counseling/ProfessorScheduleList";
import CounselingDetailForProfessor from "../components/Counseling/CounselingDetailForProfessor";
import { useModal } from "../components/ModalContext";
import { useLocation } from "react-router-dom";

const Counseling = ({ role, user }) => {
  const location = useLocation(); // 최상단에서 Hooks 호출
  const tabFromQuery = new URLSearchParams(location.search).get("tab");
  const menuItems =
    role === "professor"
      ? ["상담 예약 관리", "학생 상담 목록", "상담 기록 조회", "화상 상담"]
      : ["상담 예약", "상담 일정", "화상 상담"];
  const [activeTab, setActiveTab] = useState(tabFromQuery || menuItems[0]);
  const [selectedSchedule, setSelectedSchedule] = useState(null); // 일정 선택
  const [inRoom, setInRoom] = useState(false); // 화상 상담 여부
  const { showModal } = useModal();
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (inRoom) {
        e.preventDefault();
        e.returnValue = ""; // 브라우저에 따라 경고창을 띄움
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [inRoom]);
  const navigateToTab = (tab, schedule = null) => {
    setActiveTab(tab);
    if (schedule) {
      setSelectedSchedule(schedule);
      setInRoom(true);
    }
  };
  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    if (inRoom) {
      showModal({
        type: "confirm",
        message:
          "상담 중입니다. 페이지를 이동하면 상담이 종료될 수 있습니다. 이동하시겠습니까?",
        onConfirm: () => {
          setActiveTab(tab);
          setSelectedSchedule(null);
          setInRoom(false);
        },
      });
      return;
    }

    setActiveTab(tab);
    setSelectedSchedule(null);
    setInRoom(false);
  };

  const sidebar = (
    <ul className="section-menu">
      {menuItems.map((item) => (
        <li
          key={item}
          className={activeTab === item ? "active" : ""}
          onClick={() => handleTabChange(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  );
  console.log(user);
  const handleSelectSchedule = (schedule) => {
    const now = new Date();
    const startTime = new Date(schedule.startTime);

    if (schedule.status === "IN_PROGRESS" || now >= startTime) {
      setSelectedSchedule(schedule);
      setInRoom(true);
      setActiveTab("화상 상담"); // 이 부분이 "상담 기록 조회"로 되어있는지 확인해보세요!
    } else if (schedule.status === "COMPLETED") {
      setSelectedSchedule(schedule);
      setActiveTab("상담 기록 조회");
    } else {
      showModal({
        type: "alert",
        message: "아직 상담 시간이 시작되지 않았습니다.",
      });
    }
  };

  return (
    <SectionLayout title="상담" sidebar={sidebar}>
      {role === "student" && (
        <>
          {activeTab === "상담 예약" && (
            <BookAppointment
              user={user}
              onBooked={() => setActiveTab("상담 일정")}
            />
          )}
          {activeTab === "상담 일정" && !inRoom && (
            <StudentScheduleList
              studentId={user.id}
              onSelect={handleSelectSchedule}
            />
          )}
          {activeTab === "화상 상담" && (
            <>
              {inRoom && selectedSchedule ? (
                <VideoRoom
                  scheduleId={selectedSchedule.id}
                  studentId={user.id}
                  professorId={selectedSchedule.professorId}
                  userRole="student"
                  userName={user.name}
                  onFinish={() => {
                    setInRoom(false);
                    setSelectedSchedule(null);
                    setActiveTab("상담 일정");
                  }}
                />
              ) : (
                <>
                  <h3>화상 상담</h3>
                  <p>상단 탭 또는 상담 일정 목록에서 상담을 선택해주세요.</p>
                </>
              )}
            </>
          )}
        </>
      )}
      {role === "professor" && (
        <>
          {activeTab === "상담 예약 관리" && (
            <>
              <ProfessorAvailabilityManager professorId={user.id} />
              {/* <ProfessorScheduleList professorId={user.id} /> */}
            </>
          )}

          {activeTab === "학생 상담 목록" && (
            <ProfessorScheduleList
              professorId={user.id}
              filterStatus={["PENDING", "CONFIRMED"]}
              onSelectSchedule={(schedule) => {
                navigateToTab("화상 상담", schedule);
              }}
            />
            // <CounselingRecordPage type="PENDING" professorId={user.id} />
          )}

          {activeTab === "상담 기록 조회" && !selectedSchedule && (
            <ProfessorScheduleList
              professorId={user.id}
              filterStatus={["COMPLETED", "IN_PROGRESS"]}
              onSelectSchedule={(schedule) => {
                if (schedule.status === "IN_PROGRESS") {
                  navigateToTab("화상 상담", schedule);
                } else {
                  setSelectedSchedule(schedule);
                }
              }}
            />
          )}
          {activeTab === "상담 기록 조회" && selectedSchedule && (
            <CounselingDetailForProfessor
              schedule={selectedSchedule}
              onBack={() => setSelectedSchedule(null)}
            />
          )}
          {activeTab === "화상 상담" && (
            <>
              {inRoom && selectedSchedule ? (
                <VideoRoom
                  scheduleId={selectedSchedule.id}
                  studentId={selectedSchedule.studentId}
                  professorId={user.id}
                  userRole="professor"
                  userName={user.name}
                  onFinish={() => {
                    setInRoom(false);
                    setSelectedSchedule(null);
                    setActiveTab("상담 기록 조회");
                  }}
                />
              ) : (
                <>
                  <h3>화상 상담</h3>
                  <p>학생 상담 목록에서 상담을 선택해주세요.</p>
                </>
              )}
            </>
          )}
        </>
      )}
    </SectionLayout>
  );
};
export default Counseling;
