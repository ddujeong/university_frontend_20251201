import React, { useEffect, useState } from "react";

import {
  getEvaluationDetail,
  getEvaluationQuestions,
} from "../../api/evaluationApi";

const EvaluationDetail = ({ id, onBack }) => {
  const [evaluation, setEvaluation] = useState(null);
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [evalData, qData] = await Promise.all([
          getEvaluationDetail(id),
          getEvaluationQuestions(),
        ]);
        setEvaluation(evalData);
        setQuestions(qData);
      } catch (error) {
        console.error("평가 상세 정보 로드 실패:", error);
      }
    };
    fetchDetail();
  }, [id]);

  // 답변 점수를 텍스트로 변환하는 함수
  const getAnswerText = (score) => {
    switch (Number(score)) {
      case 5:
        return "매우 그렇다";
      case 4:
        return "그렇다";
      case 3:
        return "보통";
      case 2:
        return "그렇지 않다";
      case 1:
        return "전혀 그렇지 않다";
      default:
        return "미응답";
    }
  };

  if (!evaluation || !questions) return <div>로딩중...</div>;

  const subjectName = evaluation.subject?.name || "과목 정보 없음";

  return (
    <div>
      <button
        onClick={onBack}
        style={{ marginBottom: "20px", padding: "10px", cursor: "pointer" }}
      >
        목록으로 돌아가기
      </button>
      <h2> 평가 상세 결과: {subjectName}</h2>

      <ul style={{ listStyleType: "none", padding: 0 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const questionKey = `question${i + 1}`;
          const answerKey = `answer${i + 1}`;
          const questionText =
            questions[questionKey] || `[질문 ${i + 1} 텍스트 없음]`;
          const answerScore = evaluation[answerKey];
          const answerText = getAnswerText(answerScore);

          return (
            <li
              key={i}
              style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}
            >
              <strong>
                {i + 1}. {questionText}:
              </strong>
              <span style={{ color: "#007bff", fontWeight: "bold" }}>
                {answerText} ({answerScore}점)
              </span>
            </li>
          );
        })}
      </ul>

      <h3 style={{ marginTop: "30px" }}> 개선사항</h3>
      <p
        style={{
          border: "1px solid #ddd",
          padding: "15px",
          backgroundColor: "#f9f9f9",
          whiteSpace: "pre-wrap",
        }}
      >
        {evaluation.improvements || "작성된 개선 사항이 없습니다."}
      </p>
    </div>
  );
};

export default EvaluationDetail;
