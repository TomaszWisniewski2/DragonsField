// src/pages/PlaytestComponents/SideboardViewer.tsx

import { useState, useRef } from "react";
import type { Player } from "../../components/types";
import type{ Zone } from "../../hooks/useSocket"; // 🌟 Importujemy typ Zone
import "./LibraryViewer.css"; 

interface SideboardViewerProps {
  player: Player | undefined;
  toggleSideboardViewer: () => void;
  playerColorClass: string;
  // 🌟 DODANY PROP: Funkcja do przenoszenia kart
  moveCard: (
    code: string,
    playerId: string,
    from: Zone,
    to: Zone,
    cardId: string
  ) => void;
  sessionCode: string; // 🌟 DODANY PROP: Kod sesji
}

export default function SideboardViewer({ 
    player, 
    toggleSideboardViewer, 
    playerColorClass,
    moveCard, // Destrukturyzacja nowego propsa
    sessionCode, // Destrukturyzacja nowego propsa
}: SideboardViewerProps) {
    
    // ... (reszta stanu i refów pozostaje bez zmian)
 
 const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(
  player && player.sideboard.length > 0 ? player.sideboard[0].image || null : null
 );
 
 const [filterText, setFilterText] = useState("");
 const dragImageRef = useRef<HTMLImageElement>(null);

 if (!player) return null;

 const sideboardCards = player.sideboard;
 const filteredCards = sideboardCards.filter(card =>
  card.name.toLowerCase().includes(filterText.toLowerCase())
 );

    // 🌟 NOWY HANDLER: Zezwalanie na upuszczenie
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Niezbędne, by umożliwić upuszczenie
        e.stopPropagation();
    };

    // 🌟 NOWY HANDLER: Obsługa upuszczenia karty do sideboardu
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const cardId = e.dataTransfer.getData("cardId");
        const fromZone = e.dataTransfer.getData("from") as Zone;

        if (cardId && fromZone && player.id) {
            console.log(`Przenoszenie karty ${cardId} z ${fromZone} do sideboard.`);
            // Wygodnie jest użyć tej samej funkcji moveCard, którą serwer obsługuje
            moveCard(
                sessionCode, 
                player.id, 
                fromZone, 
                "sideboard", // 🌟 Strefa docelowa
                cardId
            );
        }
    };

 return (
  // 🌟 DODANIE HANDLERÓW DO NAJWYŻSZEGO ELEMENTU OVERLAY
  <div 
        className={`library-viewer-overlay ${playerColorClass}`}
        onDragOver={handleDragOver} // Zezwól na przeciąganie nad obszarem
        onDrop={handleDrop} // Obsłuż upuszczenie
    > 
   <div className="library-viewer-container">
    <div className="library-viewer-header">
     <span>Viewing Sideboard ({sideboardCards.length})</span>
     <button onClick={toggleSideboardViewer}>Close</button>
    </div>
    
    <div className="library-viewer-content">
     <div className="card-image-preview">
      {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
     </div>

     {/* Lista kart (z filtrowaniem) */}
     <ul className="card-list">
      {/* ... (mapowanie kart pozostaje bez zmian) ... */}
       {filteredCards.map((card) => (
       <li
        key={card.id}
        draggable
        onDragStart={(e) => {
         e.dataTransfer.setData("cardId", card.id);
         e.dataTransfer.setData("from", "sideboard"); // Wychodząc z sideboardu
            // ... (logika przeciągania)
         if (dragImageRef.current && card.image) {
          dragImageRef.current.src = card.image;
          e.dataTransfer.setDragImage(dragImageRef.current, 50, 70);
         } else {
          e.dataTransfer.setDragImage(new Image(), 0, 0);
         }
        }}
        onMouseEnter={() => setHoveredCardImage(card.image || null)}
       >
        {card.name}
       </li>
      ))}
     </ul>

    </div>
    
    <div className="library-viewer-filter"> 
     {/* ... (filtr pozostaje bez zmian) ... */}
     <input
      type="text"
      placeholder="Filter"
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
     />
    </div>

    <img ref={dragImageRef} className="drag-image-placeholder" alt="Drag Placeholder" />
   </div>
  </div>
 );
}