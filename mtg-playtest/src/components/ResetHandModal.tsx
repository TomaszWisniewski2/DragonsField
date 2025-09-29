// src/components/StartGameModal.tsx

import React from "react";
import "./StartGameModal.css";

interface ResetHandModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ResetHandModal: React.FC<ResetHandModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <div className="modal-body">
          <p>Do you wanna Reset the Hand?</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button modal-button-confirm" onClick={onConfirm}>
            Yes
          </button>
          <button className="modal-button modal-button-cancel" onClick={onClose}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetHandModal;