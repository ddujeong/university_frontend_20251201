import React, { useState, useEffect } from "react";
import {
  createEvaluation,
  getEvaluationDetail,
  getEvaluationQuestions,
} from "../../api/evaluationApi";
import { useModal } from "../ModalContext";
import "./EvaluationForm.css";
const EvaluationForm = ({ evaluationId, subjectId, onSubmit }) => {
  const [form, setForm] = useState({
    answer1: null,
    answer2: null,
    answer3: null,
    answer4: null,
    answer5: null,
    answer6: null,
    answer7: null,
    improvements: "",
  });
  const [questions, setQuestions] = useState(null);
  const { showModal } = useModal();

  useEffect(() => {
    // 1. 질문 데이터 가져오기
    const fetchQuestions = async () => {
      try {
        const qData = await getEvaluationQuestions();
        setQuestions(qData);
      } catch (error) {
        showModal({
          type: "alert",
          message:
            error.response?.data?.message ||
            error.message ||
            "평가지를 불러오는데 실패했습니다.",
        });
      }
    };

    // 2. 기존 평가 데이터 가져오기 (수정 모드일 때)
    const fetchDetail = async () => {
      if (evaluationId && evaluationId !== 0) {
        const data = await getEvaluationDetail(evaluationId);
        setForm(data);
      }
    };

    fetchQuestions();
    fetchDetail();
  }, [evaluationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (subjectId) {
        await createEvaluation(subjectId, form);
        onSubmit();
      } else {
        showModal({
          type: "alert",
          message: "평가할 과목을 찾을 수 없습니다.",
        });
        return;
      }
    } catch (error) {
      console.error("평가 제출 실패:", error);
      showModal({
        type: "alert",
        message: error.response?.data?.message || error.message,
      });
    }
  };

  const answers = [
    { value: 5, label: "매우 그렇다" },
    { value: 4, label: "그렇다" },
    { value: 3, label: "보통" },
    { value: 2, label: "그렇지 않다" },
    { value: 1, label: "전혀 그렇지 않다" },
  ];

  // 로딩 처리
  if (!questions) return <div>평가 질문 로딩 중...</div>;

  return (
    <form onSubmit={handleSubmit} className="evaluation-container">
      <h3 className="evaluation-title">강의 평가</h3>

      {Array.from({ length: 7 }, (_, i) => {
        const questionKey = `question${i + 1}`;
        const questionText = questions[questionKey] || `질문 ${i + 1}`;
        const answerName = `answer${i + 1}`;

        return (
          <div key={i} className="question-item">
            <p className="question-text">
              {i + 1}. {questionText}
            </p>
            <div className="answer-options">
              {answers.map((a) => (
                <label key={a.value} className="answer-label">
                  <input
                    type="radio"
                    name={answerName}
                    value={a.value}
                    checked={Number(form[answerName]) === a.value}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: e.target.name,
                          value: Number(e.target.value),
                        },
                      })
                    }
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className="improvement-section">
        <p className="question-text">개선사항 (자유 기술)</p>
        <textarea
          name="improvements"
          value={form.improvements}
          onChange={handleChange}
          placeholder="강의 발전을 위한 소중한 의견을 남겨주세요."
        />
      </div>

      <div className="submit-container">
        <button type="submit" className="submit-btn">
          제출하기
        </button>
      </div>
    </form>
  );
};

export default EvaluationForm;
