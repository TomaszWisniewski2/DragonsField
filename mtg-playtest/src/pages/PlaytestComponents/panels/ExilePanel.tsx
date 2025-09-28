// src/components/Playtest/panels/ExilePanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę

// INTERFEJS DLA EXILE PANEL
interface ExilePanelProps extends PanelProps {
    toggleExileViewer: () => void;
}

// --- KOMPONENT EXILE PANEL ---

export const ExilePanel: React.FC<ExilePanelProps> = ({ onClose, panelRef, toggleExileViewer }) => {
  
  const handleViewAll = () => {
    onClose(); // Zamknij ten panel
    toggleExileViewer(); // Otwórz pełny widok wycofanych
  };

  // Pozostałe akcje
  const moveToLibrary = () => console.log("Moving all to library...");
  const moveToBottomLibrary = () => console.log("Moving all to bottom of library...");
  const moveToGraveyard = () => console.log("Moving all to graveyard...");
  const moveToHand = () => console.log("Moving all to hand...");

  const handleOtherAction = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="exile-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleViewAll}>View All</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToLibrary)}>Move All to Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToBottomLibrary)}>Move All to Bottom of Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToGraveyard)}>Move All to Graveyard</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToHand)}>Move All to Hand</button>
        </div>
      </div>
    </div>
  );
};

export type { ExilePanelProps }; // Export interfejsu