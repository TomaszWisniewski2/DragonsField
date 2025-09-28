// src/components/Playtest/panels/HandPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę do PanelProps

// Importy CSS/Stylów, jeśli są potrzebne w pliku panelu

// --- KOMPONENT HAND PANEL ---

export const HandPanel: React.FC<PanelProps> = ({ onClose, panelRef }) => {
  // Pomocnicza funkcja do obsługi akcji, która zawsze zamyka panel
  const handleAction = (action: () => void) => () => {
    onClose();
    action(); 
  };
  
  // Przykładowe akcje (aktualnie puste)
  const lookAtHand = () => console.log("Looking at hand...");
  const shuffleHand = () => console.log("Shuffling hand...");
  const toLibraryTop = () => console.log("Moving hand to library top...");
  const toLibraryBottom = () => console.log("Moving hand to library bottom...");

  return (
    <div className="hand-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleAction(lookAtHand)}>Look at Hand</button>
          <button className="hand-panel-btn" onClick={handleAction(shuffleHand)}>Shuffle Hand</button>
          <button className="hand-panel-btn" onClick={handleAction(toLibraryTop)}>To Library (Top)</button>
          <button className="hand-panel-btn" onClick={handleAction(toLibraryBottom)}>To Library (Bottom)</button>
        </div>
      </div>
    </div>
  );
};