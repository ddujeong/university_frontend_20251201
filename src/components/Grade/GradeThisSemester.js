const GradeThisSemester = ({ data, onEvaluate }) => {
  const list = data?.gradeList ?? [];

  if (!list.length) {
    return <div className="empty-row">이번 학기 성적이 없습니다.</div>;
  }
  return (
    <>
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>연도</th>
              <th>학기</th>
              <th>과목번호</th>
              <th>과목명</th>
              <th>구분</th>
              <th>학점</th>
              <th>성적</th>
              <th>강의평가</th>
            </tr>
          </thead>

          <tbody>
            {list.map((g, idx) => (
              <tr key={idx}>
                <td>{g.subYear}</td>
                <td>{g.semester}</td>
                <td>{g.subjectId}</td>
                <td>{g.subjectName}</td>
                <td>{g.majorType}</td>
                <td>{g.credit}</td>
                <td>{g.grade}</td>
                <td>
                  {g.evaluated === true ? (
                    "완료"
                  ) : (
                    <button className="eval-btn" onClick={() => onEvaluate(g)}>
                      Click
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GradeThisSemester;
