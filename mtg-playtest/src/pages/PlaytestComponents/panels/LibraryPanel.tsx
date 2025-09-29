// src/components/Playtest/panels/LibraryPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę
import type { Zone } from "../../../components/types";

// INTERFEJS DLA LIBRARY PANEL
interface LibraryPanelProps extends PanelProps {
  toggleLibraryViewer: () => void; 
  handleMoveAllCards: (from: Zone, to: Zone) => void; 
}

// --- KOMPONENT LIBRARY PANEL ---

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
     onClose,
      panelRef,
       toggleLibraryViewer,
        handleMoveAllCards,
     }) => {
  
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

   
    const handleMoveAllToGraveyard = () => handleMoveAllCards("library", "graveyard"); 
    const moveToExile = () => handleMoveAllCards("library", "exile");


  return (
    <div className="library-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleViewAll}>View All</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(drawCard)}>Draw</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(drawCard)}>-Draw X</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(shuffleLibrary)}>-Shuffle</button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />

          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtLibrary)}>-View Top Card</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtLibrary)}>-View Bottom Card</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtLibrary)}>-View Top X</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(lookAtLibrary)}>-View All</button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />

          <button className="hand-panel-btn" onClick={handleOtherAction(toHandTop)}>-Mill Top X</button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />

          <button className="hand-panel-btn" onClick={handleOtherAction(handleMoveAllToGraveyard)}>Move All to Graveyard</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToExile)}>Move All to Exile</button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />
          <button className="hand-panel-btn" onClick={handleOtherAction(toHandTop)}>-Play with Top Revealed</button>

        </div>
      </div>
    </div>
  );
};

export type { LibraryPanelProps }; // Export interfejsu