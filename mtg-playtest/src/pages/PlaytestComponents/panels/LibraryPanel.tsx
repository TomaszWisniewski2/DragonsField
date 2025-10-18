// src/components/Playtest/panels/LibraryPanel.tsx

import React, { useState } from "react";
import type { PanelProps } from "../Bottombar";
import type { Zone, Player, CardType } from "../../../components/types";

// INTERFEJS DLA LIBRARY PANEL
interface LibraryPanelProps extends PanelProps {
  toggleLibraryViewer: () => void;
  handleMoveAllCards: (from: Zone, to: Zone) => void;
  player: Player | undefined;
  sessionCode: string;
  handleCardHover: (card: CardType | null) => void;
  isTopRevealed: boolean;
  toggleTopRevealed: () => void;
  shuffle: (code: string, playerId: string) => void;
  draw: (code: string, playerId: string, count: number) => void; 
}

// --- KOMPONENT WPROWADZANIA LICZBY KART (DRAW X) ---
// Jest to wbudowany podkomponent, który wyświetla się po kliknięciu Draw X

interface DrawXInputProps {
    onDraw: (count: number) => void;
    onCancel: () => void;
}

const DrawXInputPanel: React.FC<DrawXInputProps> = ({ onDraw, onCancel }) => {
    const [count, setCount] = useState<number>(1);

    const handleConfirm = () => {
        if (count > 0) {
            onDraw(count);
        }
    };

    return (
        <div className="panel-overlay-input">
            <h4 className="panel-input-title">Draw X Cards</h4>
            <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCount(val > 0 ? val : 1);
                }}
                className="panel-input-x full-width-input"
                autoFocus
            />
            <div className="panel-input-actions">
                <button 
                    className="hand-panel-btn action-btn-confirm" 
                    onClick={handleConfirm}
                >
                    Draw {count}
                </button>
                <button 
                    className="hand-panel-btn action-btn-cancel" 
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// --- KOMPONENT LIBRARY PANEL ---

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  onClose,
  panelRef,
  toggleLibraryViewer,
  handleMoveAllCards,
  isTopRevealed,
  toggleTopRevealed,
  handleCardHover,
  shuffle,
  sessionCode,
  player,
  draw,
}) => {
  // Nowy stan do zarządzania panelem Draw X
  const [isDrawXInputOpen, setIsDrawXInputOpen] = useState(false);

  // Funkcja czyszcząca globalny podgląd
  const clearRevealState = () => {
    if (isTopRevealed) {
      handleCardHover(null);
    }
  };

  // Zmodyfikowana funkcja zamknięcia głównego panelu
  const handleClose = () => {
    clearRevealState();
    setIsDrawXInputOpen(false); // Zamknij też panel Draw X
    onClose();
  };

  const handleViewAll = () => {
    clearRevealState();
    onClose();
    toggleLibraryViewer();
  };

  // Pomocnicza funkcja do obsługi akcji, która zawsze zamyka panel i sprząta stan
  const handleActionAndClose = (action: () => void) => () => {
    clearRevealState();
    setIsDrawXInputOpen(false); // Zawsze zamyka Draw X
    onClose();
    action();
  };

  // --- LOGIKA DOBIERANIA KART ---

  const handleDrawOne = () => {
    if (player) {
      draw(sessionCode, player.id, 1);
    } else {
      console.error("Cannot draw: Player is undefined.");
    }
  };
    
  // Główna funkcja wywoływana przez DrawXInputPanel
  const handleDrawXExecute = (count: number) => {
    if (player) {
        draw(sessionCode, player.id, count);
        setIsDrawXInputOpen(false);
        onClose(); // Zamknij główny panel po akcji
    } else {
        console.error("Cannot draw: Player is undefined.");
        setIsDrawXInputOpen(false);
    }
  }

  // Funkcja otwierająca panel Draw X
  const openDrawXInput = () => {
    clearRevealState();
    setIsDrawXInputOpen(true);
  };
    
  // --- POZOSTAŁE AKCJE ---

  const handleShuffle = () => {
    if (player) {
      shuffle(sessionCode, player.id);
    } else {
      console.error("Cannot shuffle: Player is undefined.");
    }
  };

  const lookAtLibrary = () => console.log("Looking at library...");
  const millTopX = () => console.log("Milling top X...");

  const handleMoveAllToGraveyard = () =>
    handleMoveAllCards("library", "graveyard");
  const moveToExile = () => handleMoveAllCards("library", "exile");

  // Jeśli panel Draw X jest otwarty, renderujemy tylko jego
  if (isDrawXInputOpen) {
    return (
        <div className="library-panel-floating" ref={panelRef}>
            <DrawXInputPanel 
                onDraw={handleDrawXExecute}
                onCancel={() => setIsDrawXInputOpen(false)}
            />
        </div>
    );
  }

  // Normalny widok panelu biblioteki
  return (
    <div className="library-panel-floating" ref={panelRef}>
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={handleClose}>
          &times;
        </button>
        <div className="hand-panel-options-list">
          
          {/* DRAW 1 */}
          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(handleDrawOne)}
          >
            Draw
          </button>

          {/* PRZYCISK OTWIERAJĄCY PANEL DRAW X */}
          <button
            className="hand-panel-btn"
            onClick={openDrawXInput}
          >
            Draw X
          </button>

          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(handleShuffle)}
          >
            Shuffle
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />

          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(lookAtLibrary)}
          >
            -View Top Card
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(lookAtLibrary)}
          >
            -View Bottom Card
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(lookAtLibrary)}
          >
            -View Top X
          </button>
          <button className="hand-panel-btn" onClick={handleViewAll}>
            View All
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />

          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(millTopX)}
          >
            -Mill Top X
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />

          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(handleMoveAllToGraveyard)}
          >
            Move All to Graveyard
          </button>
          <button
            className="hand-panel-btn"
            onClick={handleActionAndClose(moveToExile)}
          >
            Move All to Exile
          </button>
          <hr style={{ borderColor: "#444", margin: "2px 0" }} />
          <button
            className={`hand-panel-btn ${isTopRevealed ? 'active-reveal-btn' : ''}`}
            onClick={toggleTopRevealed}
          >
            {isTopRevealed ? 'Stop Revealing Top' : 'Play with Top Revealed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export type { LibraryPanelProps };