// src/components/Playtest/panels/GraveyardPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę
import type { Zone } from "../../../components/types";

// INTERFEJS DLA GRAVEYARD PANEL
interface GraveyardPanelProps extends PanelProps {
  sessionCode: string;
  playerId: string;
  toggleGraveyardViewer: () => void;
  handleMoveAllCards: (from: Zone, to: Zone) => void;
  moveAllCardsToBottomOfLibrary: (code: string, playerId: string, from: Zone) => void;
}

// --- KOMPONENT GRAVEYARD PANEL ---

export const GraveyardPanel: React.FC<GraveyardPanelProps> = ({
  onClose,
  sessionCode,
  playerId,
  panelRef,
  toggleGraveyardViewer,
  handleMoveAllCards,
  moveAllCardsToBottomOfLibrary,
}) => {

  const handleViewAll = () => {
    onClose(); // Zamknij ten panel
    toggleGraveyardViewer(); // Otwórz pełny widok cmentarza
  };

  // Pozostałe akcje


  const moveToLibrary = () => handleMoveAllCards("graveyard", "library");
  const moveToExile = () => handleMoveAllCards("graveyard", "exile");
  const moveToHand = () => handleMoveAllCards("graveyard", "hand");


  const handleOtherAction = (action: () => void) => () => {
    onClose();
    action();
  };

  const moveToBottom = () => moveAllCardsToBottomOfLibrary(sessionCode, playerId, "graveyard");

  return (
    <div className="graveyard-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleViewAll}>View All </button>
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToLibrary)}>Move All to Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToBottom)}>Move All to Bottom of Library</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToExile)}>Move All to Exile</button>
          <button className="hand-panel-btn" onClick={handleOtherAction(moveToHand)}>Move All to Hand</button>
        </div>
      </div>
    </div>
  );
};

export type { GraveyardPanelProps }; // Export interfejsu