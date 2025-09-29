// src/components/Playtest/panels/HandPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę do PanelProps
import type { Zone } from "../../../components/types";

// Importy CSS/Stylów, jeśli są potrzebne w pliku panelu
interface HandPanelProps extends PanelProps {
 // DODAJEMY NOWY PROP - Oczekujemy UPROSZCZONEJ funkcji
handleMoveAllCards: (from: Zone, to: Zone) => void; 
}
// --- KOMPONENT HAND PANEL ---

export const HandPanel: React.FC<HandPanelProps> = ({ 
    onClose,
     panelRef,
     handleMoveAllCards 
     }) => {
  // Pomocnicza funkcja do obsługi akcji, która zawsze zamyka panel
  const handleAction = (action: () => void) => () => {
    onClose();
    action(); 
  };
  
  // Przykładowe akcje (aktualnie puste)

  const shuffleHand = () => console.log("Shuffling hand...");
  const toLibraryBottom = () => console.log("Moving hand to library bottom...");



  const moveToLibrary = () => handleMoveAllCards("hand", "library");
    const handleMoveAllToGraveyard = () => handleMoveAllCards("hand", "graveyard"); 
    const moveToExile = () => handleMoveAllCards("hand", "exile");

  return (
    <div className="hand-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleAction(moveToLibrary)}>Move All to Library</button>
          <button className="hand-panel-btn" onClick={handleAction(shuffleHand)}>-Move All to Bottom of Library</button>
          <button className="hand-panel-btn" onClick={handleAction(handleMoveAllToGraveyard)}>Move All to Graveyard</button>
          <button className="hand-panel-btn" onClick={handleAction(moveToExile)}>Move All to Exile</button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />
          <button className="hand-panel-btn" onClick={handleAction(toLibraryBottom)}>-Discard a Card Randomly</button>
        </div>
      </div>
    </div>
  );
};