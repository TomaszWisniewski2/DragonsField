// src/components/Playtest/panels/CardPanel.tsx

import React from "react";
// Zakładamy, że PanelProps i CardType są już poprawnie zaimportowane z types.ts
import type { PanelProps, CardType } from "../../../components/types";

// INTERFEJS DLA CARDPANEL
interface CardPanelProps extends PanelProps {
 card: CardType;
 position: { x: number; y: number };
 panelDirection: 'up' | 'down';
 // Funkcje akcji
 moveCardToGraveyard: (cardId: string) => void;
 moveCardToExile: (cardId: string) => void;
 moveCardToTopOfLibrary: (cardId: string) => void;
 // NOWA FUNKCJA
 moveCardToBottomOfLibrary: (cardId: string) => void; 
}

// --- KOMPONENT CARD PANEL (ZMODYFIKOWANY, ABY UŻYWAĆ KLAS CSS) ---

export const CardPanel: React.FC<CardPanelProps> = ({
 onClose,
 panelRef,
 card,
 position,
 panelDirection,
 moveCardToGraveyard,
 moveCardToExile,
 moveCardToTopOfLibrary,
 moveCardToBottomOfLibrary, // NOWY PROP
}) => {
 // Funkcje do obsługi akcji, używają już logiki zamknięcia panelu
 const handleUntap = () => { onClose(); console.log(`Untapping card: ${card.name}`); };

 const handleSetStats = () => { onClose(); console.log(`Setting stats for ${card.name}`); };

 const handleMoveToGraveyard = () => { moveCardToGraveyard(card.id); onClose(); };
 const handleMoveToExile = () => { moveCardToExile(card.id); onClose(); };
 
 const handleMovetoTopofLibrary = () => { moveCardToTopOfLibrary(card.id); onClose(); };

 // NOWA FUNKCJA DO OBSŁUGI PRZENOSZENIA NA DÓŁ BIBLIOTEKI
 const handleMovetoBottomofLibrary = () => { moveCardToBottomOfLibrary(card.id); onClose(); };
 
 // Logika transformacji oparta na kierunku (MUSIMY ZACHOWAĆ DYNAMICZNE STYLE)
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
      margin: '0 12px 5px 12px',
      paddingTop: '10px',
      borderBottom: '1px solid #444',
      paddingBottom: '5px'
     }}
    >
     {card.name}
    </h4>

    {/* Lista opcji używa klasy CSS */}
    <div className="hand-panel-options-list">
     <button className="hand-panel-btn" onClick={handleMovetoTopofLibrary}>Move to Top of Library</button>
     
     {/* NOWY PRZYCISK */}
     <button className="hand-panel-btn" onClick={handleMovetoBottomofLibrary}>Move to Bottom of Library</button>

     <hr style={{ borderColor: "#444", margin: "2px 0" }} /> {/* Separator dla czytelności */}
     
     <button className="hand-panel-btn" onClick={handleUntap}>-Move to Battlefield</button>
     <button className="hand-panel-btn" onClick={handleMoveToGraveyard}>Move to Graveyard</button>
     <button className="hand-panel-btn" onClick={handleMoveToExile}>Move to Exile</button>
     <button className="hand-panel-btn" onClick={handleSetStats}>-View Card</button>
    </div>
   </div>
  </div>
 );
};

export type { CardPanelProps };