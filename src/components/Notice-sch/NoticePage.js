import React, { useEffect, useState } from "react";
import { getNoticeList } from "../../api/noticeApi";
import { useLocation } from "react-router-dom";
import { useModal } from "../ModalContext";
import Pagination from "../Layout/Pagination";
import NoticeForm from "./NoticeForm";
import NoticeDetail from "./NoticeDetail";

const NoticePage = ({ role }) => {
  const location = useLocation();
  const [pageData, setPageData] = useState(null);
  const state = location.state || {};
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [view, setView] = useState(
    state.view === "detail" && state.noticeId ? "detail" : "list"
  ); // list / write / detail
  const [selectedNoticeId, setSelectedNoticeId] = useState(
    state.noticeId ?? null
  );
  const { showModal } = useModal();
  useEffect(() => {
    if (view === "detail" && !selectedNoticeId) {
      setView("list");
    }
  }, [view, selectedNoticeId]);

  const fetchList = async () => {
    try {
      const data = await getNoticeList(page, keyword, searchType);
      setPageData(data);
    } catch (err) {
      showModal({
        type: "alert",
        message: err.response?.data?.message || err.message,
      });
    }
  };

  useEffect(() => {
    if (view === "list") fetchList();
  }, [page, view]);

  if (view === "edit" || view === "write") {
    return (
      <NoticeForm
        role={role}
        noticeId={selectedNoticeId}
        onBack={() => setView("list")}
      />
    );
  }

  if (view === "detail") {
    return (
      <NoticeDetail
        noticeId={selectedNoticeId}
        onBack={() => setView("list")}
        onEdit={(id) => {
          setSelectedNoticeId(id); // 어떤 글을 수정할지 저장
          setView("edit"); // edit 모드로 전환
        }}
        role={role}
      />
    );
  }

  if (!pageData) return <>로딩중...</>;

  return (
    <>
      <h3>공지사항</h3>

      {/* 검색 */}
      <div className="department-form">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="title">제목</option>
          <option value="content">제목 + 내용</option>
        </select>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어 입력"
        />
        <button
          className="search-btn"
          onClick={() => {
            setPage(0);
            fetchList();
          }}
        >
          검색
        </button>
        {role === "staff" && (
          <button
            className="search-btn"
            onClick={() => {
              setSelectedNoticeId(null); // ★ 초기화
              setView("write");
            }}
          >
            새 글 등록
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>말머리</th>
              <th>제목</th>
              <th>작성일</th>
              <th>조회수</th>
            </tr>
          </thead>
          <tbody>
            {pageData.content.map((n) => (
              <tr key={n.id}>
                <td>{n.id}</td>
                <td>{n.category}</td>
                <td
                  className="notice-page__title-cell"
                  onClick={() => {
                    setSelectedNoticeId(n.id);
                    setView("detail");
                  }}
                >
                  {n.title}
                </td>
                <td>{new Date(n.createdTime).toLocaleDateString()}</td>
                <td>{n.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <Pagination
        page={page}
        totalPages={pageData.totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </>
  );
};

export default NoticePage;
