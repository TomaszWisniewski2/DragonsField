// src/components/Playtest/panels/LibraryPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę

// INTERFEJS DLA LIBRARY PANEL
interface LibraryPanelProps extends PanelProps {
  toggleLibraryViewer: () => void; 
}

// --- KOMPONENT LIBRARY PANEL ---

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ onClose, panelRef, toggleLibraryViewer }) => {
  
  const handleViewAll = () => {
    onClose(); // Zamknij ten panel
    toggleLibraryViewer(); // Otwórz pełny widok biblioteki
  };
  
  // Pozostałe akcje
  const drawCard = () => console.log("Drawing a card...");
  const shuffleLibrary = () => console.log("Shuffling library...");
  const lookAtLibrary = () => console.log("Looking at library...");
  const toHandTop = () => console.log("Moving card to hand (top)...");

  const handleOtherAction = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <div className="library-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleViewAll}>View All</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(drawCard)}>Draw a Card</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(shuffleLibrary)}>Shuffle Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtLibrary)}>Look at Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(toHandTop)}>To Hand (Top)</button>
        </div>
      </div>
    </div>
  );
};

export type { LibraryPanelProps }; // Export interfejsu