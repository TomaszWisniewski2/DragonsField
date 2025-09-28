// src/pages/PlaytestComponents/panels/BattlefieldCardPanel.tsx

import React from "react";
// Importujemy wspólne typy. Dostosuj ścieżkę do Twojej struktury katalogów
import type { CardType, PanelProps } from "../../../components/types"; 

// INTERFEJS DLA PANELU KARTY NA POLU BITWY
export interface BattlefieldCardPanelProps extends PanelProps {
  card: CardType;
  position: { x: number; y: number };
  panelDirection: 'up' | 'down'; 
  // Funkcje akcji na polu bitwy (przekazywane z Battlefield)
  rotateCard: (cardId: string) => void;
  moveCardToGraveyard: (cardId: string) => void;
  moveCardToHand: (cardId: string) => void;
  moveCardToExile: (cardId: string) => void;
}

// --- KOMPONENT BATTLEFIELD CARD PANEL ---

export const BattlefieldCardPanel: React.FC<BattlefieldCardPanelProps> = ({ 
    onClose, 
    panelRef, 
    card, 
    position, 
    panelDirection, 
    rotateCard, 
    moveCardToGraveyard, 
    moveCardToHand,
    moveCardToExile
}) => {
  // Funkcje obsługi
  const handleTap = () => { rotateCard(card.id); onClose(); }; 
  const handleMoveToGraveyard = () => { moveCardToGraveyard(card.id); onClose(); };
  const handleMoveToHand = () => { moveCardToHand(card.id); onClose(); };
  const handleMoveToExile = () => { moveCardToExile(card.id); onClose(); };
  const handleAddCounter = () => { onClose(); console.log(`Adding counter to ${card.name}`); };
  const handleSetStats = () => { onClose(); console.log(`Setting P/T for ${card.name}`); };


  // Logika transformacji oparta na kierunku (pozostaje inline dla pozycjonowania)
  const transformStyle = `translate(-50%, ${panelDirection === 'up' ? '-100%' : '0'})`;

  return (
    // Używamy klas CSS do stylizacji wnętrza, zachowując dynamiczne pozycjonowanie inline
    <div
      className="hand-panel-floating card-panel-override2"
      ref={panelRef}
      style={{
        position: 'fixed', 
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: transformStyle, 
        zIndex: 9999, 
        // Usunięto: minWidth, backgroundColor, borderRadius, boxShadow (przeniesione do CSS)
      }}
    >
      <div className="hand-panel-content">
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        
        {/* Tytuł karty w panelu */}
        <h4 
            style={{ 
                color: 'white', 
                margin: '0 12px 5px 12px', 
                paddingTop: '10px', 
                borderBottom: '1px solid #444', 
                paddingBottom: '5px' 
            }}
        >
            {card.name}
        </h4>
        
        {/* Lista opcji używa klas CSS */}
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleTap}>Tap/Untap (T)</button>
          <button className="hand-panel-btn" onClick={handleAddCounter}>Add Counter</button>
          <button className="hand-panel-btn" onClick={handleSetStats}>Set P/T</button>
          
          <hr style={{ borderColor: '#444', margin: '2px 0' }} />
          
          <button className="hand-panel-btn action-graveyard" onClick={handleMoveToGraveyard}>To Graveyard</button>
          <button className="hand-panel-btn action-hand" onClick={handleMoveToHand}>To Hand</button>
          <button className="hand-panel-btn action-exile" onClick={handleMoveToExile}>To Exile</button>
          
        </div>
      </div>
    </div>
  );
};