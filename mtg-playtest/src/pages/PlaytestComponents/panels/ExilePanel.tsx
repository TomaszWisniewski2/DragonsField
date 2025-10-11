import React from "react";
import type { PanelProps } from "../Bottombar";
import type { Zone } from "../../../components/types";

// INTERFEJS DLA EXILE PANEL
interface ExilePanelProps extends PanelProps {
      sessionCode: string;
      playerId: string;
      toggleExileViewer: () => void;
      // DODAJEMY NOWY PROP - Oczekujemy UPROSZCZONEJ funkcji
      handleMoveAllCards: (from: Zone, to: Zone) => void;
      moveAllCardsToBottomOfLibrary: (code: string, playerId: string, from: Zone) => void;
}

// --- KOMPONENT EXILE PANEL ---

export const ExilePanel: React.FC<ExilePanelProps> = ({
      onClose,
      sessionCode,
      playerId,
      panelRef,
      toggleExileViewer,
      handleMoveAllCards,
      moveAllCardsToBottomOfLibrary
}) => {

      const handleViewAll = () => {
            onClose(); // Zamknij ten panel kontekstowy
            toggleExileViewer(); // Otwórz pełny widok ExileViewer
      };

      // Funkcje pomocnicze do wywoływania głównej logiki przenoszenia.
      // Strefa źródłowa jest zawsze "exile".

      const moveToLibrary = () => handleMoveAllCards("exile", "library");

      const handleMoveAllToGraveyard = () => handleMoveAllCards("exile", "graveyard");

      const moveToHand = () => handleMoveAllCards("exile", "hand");

      // Wrapper do zamknięcia panelu przed wykonaniem akcji przenoszenia
      const handleOtherAction = (action: () => void) => () => {
            onClose();
            action();
      };

      const moveToBottom = () => moveAllCardsToBottomOfLibrary(sessionCode, playerId, "exile");

      return (
            <div className="exile-panel-floating" ref={panelRef}>
                  <div className="hand-panel-content">
                        <button className="hand-panel-close-btn" onClick={onClose}>
                              &times;
                        </button>
                        <div className="hand-panel-options-list">
                              <button className="hand-panel-btn" onClick={handleViewAll}>View All</button>
                              <hr style={{ borderColor: '#444', margin: '2px 0' }} />
                              <button className="hand-panel-btn" onClick={handleOtherAction(moveToLibrary)}>Move All to Library</button>
                              <button className="hand-panel-btn" onClick={handleOtherAction(moveToBottom)}>Move All to Bottom of Library</button>
                              <button className="hand-panel-btn" onClick={handleOtherAction(handleMoveAllToGraveyard)}>Move All to Graveyard</button>
                              <button className="hand-panel-btn" onClick={handleOtherAction(moveToHand)}>Move All to Hand</button>
                        </div>
                  </div>
            </div>
      );
};

export type { ExilePanelProps };