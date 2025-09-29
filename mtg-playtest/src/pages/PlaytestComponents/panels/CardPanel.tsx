// src/components/Playtest/panels/CardPanel.tsx

import React from "react";
// Zakładamy, że PanelProps i CardType są już poprawnie zaimportowane z types.ts
import type { PanelProps, CardType } from "../../../components/types"; 

// INTERFEJS DLA CARDPANEL
interface CardPanelProps extends PanelProps {
  card: CardType;
  position: { x: number; y: number };
  panelDirection: 'up' | 'down'; 
  // W przyszłości dodasz tutaj funkcje do faktycznych akcji, np. moveToGraveyard: (cardId: string) => void;
}

// --- KOMPONENT CARD PANEL (ZMODYFIKOWANY, ABY UŻYWAĆ KLAS CSS) ---

export const CardPanel: React.FC<CardPanelProps> = ({ onClose, panelRef, card, position, panelDirection }) => {
  // Funkcje do obsługi akcji, używają już logiki zamknięcia panelu, jak w ExilePanel
  const handleTap = () => { onClose(); console.log(`Tapping card: ${card.name}`); };
  const handleUntap = () => { onClose(); console.log(`Untapping card: ${card.name}`); };
  const handleMoveToGraveyard = () => { onClose(); console.log(`Moving ${card.name} to graveyard`); };
  const handleAddCounter = () => { onClose(); console.log(`Adding counter to ${card.name}`); };
  const handleSetStats = () => { onClose(); console.log(`Setting stats for ${card.name}`); };


  // Logika transformacji oparta na kierunku (MUSIMY ZACHOWAĆ DYNAMICZNE STYLE)
  // Przesunięcie o -50% w lewo centruje panel na osi X kliknięcia.
  // Przesunięcie o -100% w górę (dla 'up') lub 0% (dla 'down') pozycjonuje go poprawnie.
  const transformStyle = `translate(-50%, ${panelDirection === 'up' ? '-100%' : '0'})`;

  return (
    // Używamy "hand-panel-floating" jako kontenera głównego dla dynamicznego pozycjonowania
    <div
      className="hand-panel-floating card-panel-override" 
      ref={panelRef}
      style={{
        // Te style muszą pozostać inline dla poprawnego pozycjonowania kontekstowego
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: transformStyle, 
        zIndex: 100, // Upewniamy się, że jest nad wszystkim
        // Usunięto: backgroundColor, borderRadius, boxShadow - przejęte przez CSS
      }}
    >
      {/* hand-panel-content dla tła i cienia */}
      <div className="hand-panel-content"> 
        {/* Przycisk zamykania używa klasy CSS */}
        <button className="hand-panel-close-btn" onClick={onClose}>
          &times;
        </button>
        
        {/* Wyróżnienie nazwy karty */}
        <h4 
            style={{ 
                color: 'white', 
                margin: '0 12px 5px 12px', // Dodano marginesy poziome dla estetyki
                paddingTop: '10px', // Odsunięcie od przycisku X
                borderBottom: '1px solid #444', 
                paddingBottom: '5px' 
            }}
        >
            {card.name}
        </h4>
        
        {/* Lista opcji używa klasy CSS */}
        <div className="hand-panel-options-list">
          <button className="hand-panel-btn" onClick={handleTap}>-Move to Top of Library</button>
          <button className="hand-panel-btn" onClick={handleUntap}>-Move to Battlefield</button>
          <button className="hand-panel-btn" onClick={handleMoveToGraveyard}>-Move to Graveyard</button>
          <button className="hand-panel-btn" onClick={handleAddCounter}>-Move to Exile</button>
          <button className="hand-panel-btn" onClick={handleSetStats}>-View Card</button>
        </div>
      </div>
    </div>
  );
};

export type { CardPanelProps };