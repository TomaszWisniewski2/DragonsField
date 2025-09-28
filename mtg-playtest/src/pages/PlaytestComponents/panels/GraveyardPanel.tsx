// src/components/Playtest/panels/GraveyardPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę

// INTERFEJS DLA GRAVEYARD PANEL
interface GraveyardPanelProps extends PanelProps {
  toggleGraveyardViewer: () => void; 
}

// --- KOMPONENT GRAVEYARD PANEL ---

export const GraveyardPanel: React.FC<GraveyardPanelProps> = ({ onClose, panelRef, toggleGraveyardViewer }) => {
  
  const handleViewAll = () => {
    onClose(); // Zamknij ten panel
    toggleGraveyardViewer(); // Otwórz pełny widok cmentarza
  };

  // Pozostałe akcje
  const lookAtGraveyard = () => console.log("Looking at graveyard...");
  const shuffleToLibrary = () => console.log("Shuffling graveyard to library...");
  const toHandTop = () => console.log("Moving card to hand (top)...");
  const toLibraryBottom = () => console.log("Moving card to library (bottom)...");

  const handleOtherAction = (action: () => void) => () => {
    onClose();
    action();
  };
  
  return (
    <div className="graveyard-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleViewAll}>View All </button>
          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtGraveyard)}>Look at Graveyard</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(shuffleToLibrary)}>Shuffle Graveyard to Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(toHandTop)}>To Hand (Top)</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(toLibraryBottom)}>To Library (Bottom)</button>
        </div>
      </div>
    </div>
  );
};

export type { GraveyardPanelProps }; // Export interfejsu