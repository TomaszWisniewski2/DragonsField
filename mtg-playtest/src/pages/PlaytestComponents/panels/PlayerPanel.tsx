// src/pages/PlaytestComponents/panels/PlayerPanel.tsx

import React from "react";
import type { Player } from "../../../components/types";
import "./PlayerPanel.css"; 

// Interfejs dla propów PlayerPanel
interface PlayerPanelProps {
// Funkcja zamykająca panel
onClose: () => void;
// USUNIĘTO: panelRef: React.RefObject<HTMLDivElement | null>;
// Gracz, dla którego otwieramy panel (WŁASNY lub Przeciwnik)
targetPlayer: Player;
// Funkcja do otwierania GraveyardViewer, przyjmująca ID gracza
openGraveyardViewerForPlayer: (playerId: string) => void;
// Funkcja do przełączania głównego widoku na tego gracza
setViewedPlayerId: (id: string | null) => void;
// Klasa koloru dla stylizacji
playerColorClass: string;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
onClose,
// USUNIĘTO: panelRef,
targetPlayer,
openGraveyardViewerForPlayer,
setViewedPlayerId,
playerColorClass,
}) => {
// Funkcja otwierająca GraveyardViewer i zamykająca PlayerPanel
const handleViewGraveyard = () => {
 onClose();
 openGraveyardViewerForPlayer(targetPlayer.id);
};

// Funkcja zmieniająca widok pola bitwy
const handleViewBattlefield = () => {
 onClose();
 setViewedPlayerId(targetPlayer.id === targetPlayer.id ? targetPlayer.id : null); // Jeśli to my, wracamy do widoku własnego (null)
};

return (
 // USUNIĘTO ref={panelRef}, ponieważ kontener nadrzędny już go ma
 <div className={`player-panel-floating ${playerColorClass}`}>
 <div className="player-panel-content">
  <button className="player-panel-close-btn" onClick={onClose}>
  &times;
  </button>
  <div className="player-panel-header">
  Opcje dla: <strong>{targetPlayer.name}</strong>
  </div>
  <div className="player-panel-options-list">
  {/* Opcja 1: Zmień widok na Pole Bitwy przeciwnika */}
  <button className="player-panel-btn" onClick={handleViewBattlefield}>
   View Battlefield
  </button>
  <hr />
  {/* Opcja 2: Otwórz Graveyard przeciwnika */}
  <button className="player-panel-btn" onClick={handleViewGraveyard}>
   View Graveyard ({targetPlayer.graveyard.length})
  </button>
  <button className="player-panel-btn" disabled>
   View Hand (Closed)
  </button>
  </div>
 </div>
 </div>
);
};