// src/components/Playtest/panels/LibraryPanel.tsx

import React from "react";
import type { PanelProps } from "../Bottombar";
import type { Zone, Player, CardType } from "../../../components/types";

// INTERFEJS DLA LIBRARY PANEL
interface LibraryPanelProps extends PanelProps {
 toggleLibraryViewer: () => void;
 handleMoveAllCards: (from: Zone, to: Zone) => void;
 player: Player | undefined;
 sessionCode: string;
 handleCardHover: (card: CardType | null) => void;
 // NOWE PROPSY DLA WIDOCZNOŚCI GÓRNEJ KARTY W STREFIE
 isTopRevealed: boolean;
 toggleTopRevealed: () => void;
  shuffle: (code: string, playerId: string) => void;
}

// --- KOMPONENT LIBRARY PANEL ---

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
 onClose,
 panelRef,
 toggleLibraryViewer,
 handleMoveAllCards,
 isTopRevealed, // Otrzymany stan
 toggleTopRevealed, // Otrzymana funkcja przełączająca
 handleCardHover, // Używane do czyszczenia globalnego podglądu
 shuffle,
 sessionCode,
 player,
}) => {

 // Funkcja czyszcząca globalny podgląd (który może być aktywny, jeśli isTopRevealed == true)
 const clearRevealState = () => {
  if (isTopRevealed) {
   handleCardHover(null);
  }
 };

 // Zmodyfikowana funkcja zamknięcia: musi posprzątać po ewentualnie odkrytej karcie
 const handleClose = () => {
  clearRevealState();
  onClose();
 };

 const handleViewAll = () => {
  clearRevealState(); // Ukryj odkrytą kartę przed otwarciem dużego widoku
  onClose();
  toggleLibraryViewer();
 };

 // Pozostałe akcje
 const drawCard = () => console.log("Drawing a card...");
 //const shuffleLibrary = () => console.log("Shuffling library...");
 const lookAtLibrary = () => console.log("Looking at library...");
 const millTopX = () => console.log("Milling top X...");

 // Pomocnicza funkcja do obsługi akcji, która zawsze zamyka panel i sprząta stan
 const handleActionAndClose = (action: () => void) => () => {
  clearRevealState();
  onClose();
  action();
 };

 const handleMoveAllToGraveyard = () =>
  handleMoveAllCards("library", "graveyard");
 const moveToExile = () => handleMoveAllCards("library", "exile");

// New function to handle shuffling safely
const handleShuffle = () => {
  // Check if player is defined before calling shuffle
  if (player) {
    shuffle(sessionCode, player.id);
  } else {
    console.error("Cannot shuffle: Player is undefined.");
  }
};

 return (
  <div className="library-panel-floating" ref={panelRef}>
   <div className="hand-panel-content">
    <button className="hand-panel-close-btn" onClick={handleClose}>
     &times;
    </button>
    <div className="hand-panel-options-list">
     <button
      className="hand-panel-btn"
      onClick={handleActionAndClose(drawCard)}
     >
      Draw
     </button>
     <button
      className="hand-panel-btn"
      onClick={handleActionAndClose(drawCard)}
     >
      -Draw X
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
      onClick={toggleTopRevealed} // Używamy funkcji z Bottombar.tsx
     >
      {isTopRevealed ? 'Stop Revealing Top' : 'Play with Top Revealed'}
     </button>
    </div>
   </div>
  </div>
 );
};

export type { LibraryPanelProps }; // Export interfejsu