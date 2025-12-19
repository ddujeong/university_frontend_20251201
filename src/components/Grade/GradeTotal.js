const GradeTotal = ({ data }) => {
  return (
    <>
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>연도</th>
              <th>학기</th>
              <th>신청학점</th>
              <th>취득학점</th>
              <th>평점평균</th>
            </tr>
          </thead>

          <tbody>
            {data.gradeList?.length ? (
              data.gradeList.map((mg, idx) => (
                <tr key={idx}>
                  <td>{mg.subYear}</td>
                  <td>{mg.semester}</td>
                  <td>{mg.totalCredit}</td>
                  <td>{mg.earnedCredit}</td>
                  <td>{Number(mg.averageScore).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-row">
                  누계 성적 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default GradeTotal;
