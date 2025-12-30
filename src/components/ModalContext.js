import React, { createContext, useContext, useState } from "react";
import "./ModalContext.css";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: null,
    onCancel: null,
    autoClose: 0,
  });

  const showModal = ({
    type = "alert",
    message = "",
    onConfirm = null,
    onCancel = null,
    autoClose = 0,
  }) => {
    setModal({ isOpen: true, type, message, onConfirm, onCancel, autoClose });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <ModalContext.Provider value={{ modal, showModal, closeModal }}>
      {children}

      {modal.isOpen && (
        <div className="modal-context-overlay">
          <div className="modal-context-card">
            <p>{modal.message}</p>
            {modal.type === "alert" && (
              <button className="confirm-btn" onClick={closeModal}>
                확인
              </button>
            )}
            {modal.type === "confirm" && (
              <div>
                <button
                  className="confirm-btn"
                  onClick={() => {
                    modal.onConfirm?.();
                    closeModal();
                  }}
                >
                  확인
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    modal.onCancel?.();
                    closeModal();
                  }}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
