// src/pages/PlaytestComponents/panels/PlayerPanel.tsx (ZMODYFIKOWANY)

import React from "react";
import type { Player } from "../../../components/types";
import "./PlayerPanel.css"; 
import type { Session } from "../../../hooks/useSocket"; // Musimy zaimportować typ Session

// ZMODYFIKOWANY INTERFEJS PROPSÓW
interface PlayerPanelProps {
  // Funkcja zamykająca panel
  onClose: () => void;
  // Gracz, dla którego otwieramy panel (WŁASNY lub Przeciwnik)
  targetPlayer: Player;
    // NOWY PROP: typ sesji, aby warunkowo pokazać dowódcę
    sessionType: Session['sessionType'];
  // Funkcja do otwierania GraveyardViewer, przyjmująca ID gracza
  openGraveyardViewerForPlayer: (playerId: string) => void;
  // Funkcja do przełączania głównego widoku na tego gracza
  setViewedPlayerId: (id: string | null) => void;
  // Klasa koloru dla stylizacji
  playerColorClass: string;
  
  // === FUNKCJE DLA WIDOKÓW PRZECIWNIKA ===
  openExileViewerForPlayer: (playerId: string) => void; 
  openLibraryViewerForPlayer: (playerId: string) => void;
  openCommanderViewerForPlayer: (playerId: string) => void;
  // ===========================================
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  onClose,
  targetPlayer,
    sessionType, // NOWY PROP
  openGraveyardViewerForPlayer,
  setViewedPlayerId,
  playerColorClass,
  openExileViewerForPlayer,
  openLibraryViewerForPlayer,
  openCommanderViewerForPlayer,
}) => {
  
  // Funkcja otwierająca GraveyardViewer i zamykająca PlayerPanel
  const handleViewGraveyard = () => {
    onClose();
    openGraveyardViewerForPlayer(targetPlayer.id);
  };

  // Funkcja zmieniająca widok pola bitwy
  const handleViewBattlefield = () => {
    onClose();
    setViewedPlayerId(targetPlayer.id); 
  };

  // NOWA FUNKCJA: Otwieranie Exilu przeciwnika
  const handleViewExile = () => {
    onClose();
    openExileViewerForPlayer(targetPlayer.id);
  };

  // NOWA FUNKCJA: Otwieranie Biblioteki przeciwnika
  const handleViewLibrary = () => {
    onClose();
    openLibraryViewerForPlayer(targetPlayer.id);
  };
    
  // NOWA FUNKCJA: Otwieranie CommanderViewer przeciwnika
 const handleViewCommander = () => {
  onClose();
  openCommanderViewerForPlayer(targetPlayer.id); // <<< DODANE
 };
// Uproszczona logika dla dowódcy - zakłada, że dowódca jest w players[].commander
  // Zakładamy, że `targetPlayer.commander` to lista kart (CardType[])
  const hasCommander = sessionType === 'commander' && 
            targetPlayer.commander && 
            (Array.isArray(targetPlayer.commander) ? targetPlayer.commander.length > 0 : true); // Sprawdzamy czy coś tam jest

  return (
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
                    
 {/* AKTYWOWANY PRZYCISK DOWÓDCY */}
          {hasCommander && (
      <button 
              className="player-panel-btn" 
              onClick={handleViewCommander} // <<< AKTYWOWANY!
            >
       View Commander 👑
      </button>
                    )}
                    
          {/* Opcja 2: Otwórz Graveyard przeciwnika */}
          <button className="player-panel-btn" onClick={handleViewGraveyard}>
          View Graveyard ({targetPlayer.graveyard.length})
          </button>
          
          {/* NOWOŚĆ: Otwórz Exile przeciwnika */}
          <button className="player-panel-btn" onClick={handleViewExile}>
          View Exile ({targetPlayer.exile.length})
          </button>
          <hr />
          {/* NOWOŚĆ: Otwórz Library przeciwnika */}
          <button className="player-panel-btn" onClick={handleViewLibrary}>
          View Library ({targetPlayer.library.length})
          </button>
          
          <button className="player-panel-btn" disabled>
          View Hand (Closed)
          </button>
        </div>
      </div>
    </div>
  );
};