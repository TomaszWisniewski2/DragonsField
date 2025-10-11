// src/components/Playtest/panels/HandPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar"; // Zaktualizuj ścieżkę do PanelProps
import type { Zone, SortCriteria } from "../../../components/types";

// Importy CSS/Stylów, jeśli są potrzebne w pliku panelu
interface HandPanelProps extends PanelProps {
  // DODAJEMY NOWY PROP - Oczekujemy UPROSZCZONEJ funkcji
  handleMoveAllCards: (from: Zone, to: Zone) => void;
  sortHand: (code: string, playerId: string, criteria: SortCriteria) => void;
  sessionCode: string;
  playerId: string;
  moveAllCardsToBottomOfLibrary: (
    code: string,
    playerId: string,
    from: Zone
  ) => void;
  discardRandomCard: (code: string, playerId: string) => void;
}
// --- KOMPONENT HAND PANEL ---

export const HandPanel: React.FC<HandPanelProps> = ({
  onClose,
  panelRef,
  handleMoveAllCards,
  sortHand, // <--- ODBIERAMY NOWY PROP
  sessionCode,
  playerId,
  moveAllCardsToBottomOfLibrary,
  discardRandomCard,
}) => {
  // Pomocnicza funkcja do obsługi akcji, która zawsze zamyka panel
  const handleAction = (action: () => void) => () => {
    onClose();
    action();
  };
  // Funkcja sortująca
  const handleSort = (criteria: SortCriteria) =>
    handleAction(() => sortHand(sessionCode, playerId, criteria));

  const moveToLibrary = () => handleMoveAllCards("hand", "library");
  const handleMoveAllToGraveyard = () =>
    handleMoveAllCards("hand", "graveyard");
  const moveToExile = () => handleMoveAllCards("hand", "exile");
  const moveToBottom = () =>
    moveAllCardsToBottomOfLibrary(sessionCode, playerId, "hand");
 const discardRandomAction = () =>
    discardRandomCard(sessionCode, playerId); 

  return (
    <div className="hand-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          {/* NOWE PRZYCISKI SORTOWANIA */}
          <div
            style={{
              padding: "0 12px",
              color: "#ccc",
              fontSize: "0.85em",
              fontWeight: "bold",
            }}
          >
            SORTUJ:
          </div>
          <button className="hand-panel-btn" onClick={handleSort("mana_cost")}>
            Wg Kosztu Many
          </button>
          <button className="hand-panel-btn" onClick={handleSort("name")}>
            Wg Nazwy
          </button>
          <button className="hand-panel-btn" onClick={handleSort("type_line")}>
            Wg Typu
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />
          <button
            className="hand-panel-btn"
            onClick={handleAction(moveToLibrary)}
          >
            Move All to Library
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleAction(moveToBottom)}
          >
            Move All to Bottom of Library
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleAction(handleMoveAllToGraveyard)}
          >
            Move All to Graveyard
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleAction(moveToExile)}
          >
            Move All to Exile
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />
      <button
        className="hand-panel-btn"
        onClick={handleAction(discardRandomAction)} // WSKAZUJEMY CZYSTĄ AKCJĘ
      >
        Discard a Card Randomly
      </button>
        </div>
      </div>
    </div>
  );
};
