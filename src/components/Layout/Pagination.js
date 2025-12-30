import React from "react";

const Pagination = ({ page, totalPages, onPageChange }) => {
  // 페이지가 없거나 1개 미만일 때 처리
  if (totalPages <= 0) return null;

  return (
    <div className="pagination">
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        이전
      </button>

      <span>
        {page + 1} / {totalPages}
      </span>

      <button
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
};

export default Pagination;
