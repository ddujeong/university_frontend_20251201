import { useState } from "react";
import { adminApi } from "../../api/aiApi";
import { useModal } from "../ModalContext";

const AdminPage = () => {
  const { showModal } = useModal();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const runAnalysis = async () => {
    showModal({
      type: "confirm",
      message: "전체 학생 분석을 시작하시겠습니까? (시간이 소요됩니다)",
      onConfirm: async () => {
        setIsAnalyzing(true);
        try {
          await adminApi.runAnalysis();
          showModal({
            type: "alert",
            message: "분석 완료! 대시보드에서 확인하세요.",
          });
        } catch (err) {
          showModal({
            type: "alert",
            message:
              err.response?.data?.message ||
              err.message ||
              "분석 중 오류가 발생했습니다.",
          });
        } finally {
          setIsAnalyzing(false);
        }
      },
    });
  };
  return (
    <>
      <h3>위험군 학생 분석</h3>
      <div>
        <p>
          3월,9월 자동실행, 필요 시 수동으로 실행할 수 있습니다.
        </p>
        <button onClick={runAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? "분석 중..." : "중도이탈 위험 분석 즉시 실행"}
        </button>
      </div>
    </>
  );
};

export default AdminPage;
