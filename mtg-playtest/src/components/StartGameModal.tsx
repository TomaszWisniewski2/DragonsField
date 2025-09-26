// src/components/StartGameModal.tsx

import React from "react";
import "./StartGameModal.css";

interface StartGameModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const StartGameModal: React.FC<StartGameModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <div className="modal-body">
          <p>Do you wanna start the game?</p>
        </div>
        <div className="modal-footer">
          <button className="modal-button modal-button-confirm" onClick={onConfirm}>
            Tak
          </button>
          <button className="modal-button modal-button-cancel" onClick={onClose}>
            Nie
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartGameModal;