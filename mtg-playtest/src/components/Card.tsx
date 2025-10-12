// src/components/Card.tsx

import type { CardType, CardOnField } from "./types";
import "./Card.css";
import ManaCost from './ManaCost';
import CardStats from './CardStats';
import CardCounters from './CardCounters';

// --- INTERFEJS PROPSÓW ---
interface CardProps {
 card?: CardType;
 from?: string;
 ownerId?: string;
 getPlayerColorClass?: (id: string) => string;
 onCardStatsClick?: (cardId: string) => void;
 onCardCounterClick?: (cardId: string) => void; 
 onDecreaseCardStatsClick?: (cardId: string) => void;
 cardOnField?: CardOnField;
 zoom?: number;
}

// --- KOMPONENT CARD ---

export default function Card({
 card,
 from,
 ownerId,
 getPlayerColorClass,
 onCardStatsClick,
 onCardCounterClick,
 // Odbieramy nowy prop
 cardOnField,
 zoom = 100,
}: CardProps) {
 if (!card) return null;

 const colorClass = getPlayerColorClass && ownerId ? getPlayerColorClass(ownerId) : '';
 const scaleFactor = zoom / 100;

 // SPRAWDZAMY, CZY KARTA JEST TOKENEM
 const isToken = cardOnField?.isToken === true; 

 // DEDYKOWANA LOGIKA KLIKNIĘCIA DLA LICZNIKÓW (+1)
 const handleCounterIncrement = () => {
  onCardCounterClick?.(cardOnField?.id || card.id);
 };

 // DEDYKOWANA LOGIKA KLIKNIĘCIA DLA STATYSTYK (P/T)
 const handleStatsIncrement = () => {
  onCardStatsClick?.(cardOnField?.id || card.id);
 };

 return (
  <div
   className={`card-container ${colorClass} ${from === "hand" ? "hand-card" : ""} ${isToken ? "is-token" : ""}`}
   draggable={from === "hand"}
   style={{ transform: `scale(${scaleFactor})` }}
   onDragStart={(e) => {
    // ... (Logika Drag & Drop bez zmian)
    if (from === "hand") {
     e.dataTransfer.setData("cardId", card.id);
     e.dataTransfer.setData("from", from);

     const rect = e.currentTarget.getBoundingClientRect();
     const offsetX = e.clientX - rect.left;
     const offsetY = e.clientY - rect.top;
     e.dataTransfer.setData("offsetX", offsetX.toString());
     e.dataTransfer.setData("offsetY", offsetY.toString());

     const dragImg = e.currentTarget.cloneNode(true) as HTMLElement;
     dragImg.style.position = "absolute";
     dragImg.style.top = "-9999px";
     dragImg.style.transform = "none";
     document.body.appendChild(dragImg);

     e.dataTransfer.setDragImage(dragImg, offsetX, offsetY);

     setTimeout(() => document.body.removeChild(dragImg), 0);
    }
   }}
  >
    
   {/* 🌟 DODANIE ETYKIETY TOKENU 🌟 */}
   {isToken && (
    <div className="token-label">
     TOKEN
    </div>
   )}

   {/* Wskaźnik ManaCost (PRAWY GÓRNY) */}
   {from === "hand" && card.mana_cost && (
    <div className="mana-indicator">
     <ManaCost manaCost={card.mana_cost} />
    </div>
   )}

   {/* Wskaźnik siły/wytrzymałości (PRAWY DÓŁ) */}
   {from === "battlefield" && cardOnField && card.basePower !== null && card.baseToughness !== null && (
    <div className="card-stats-indicator">
     <CardStats
      basePower={card.basePower}
      baseToughness={card.baseToughness}
      currentPower={cardOnField.stats.power}
      currentToughness={cardOnField.stats.toughness}
      onIncrement={handleStatsIncrement} 
      playerColorClass={colorClass}
     />
    </div>
   )}

   {/* Wskaźnik liczników (LEWY DÓŁ) */}
   {from === "battlefield" && cardOnField && (
    <div className="card-counters-indicator">
     <CardCounters
      counters={cardOnField.counters}
      onIncrement={handleCounterIncrement} 
      playerColorClass={colorClass}
     />
    </div>
   )}

   {/* Obraz karty / Placeholder */}
   <div className="card-image-wrapper">
    {card.image ? (
     <img src={card.image} alt={card.name} className="card-image" />
    ) : (
     <div className="card-placeholder">{card.name}</div>
    )}
   </div>
  </div>
 );
}