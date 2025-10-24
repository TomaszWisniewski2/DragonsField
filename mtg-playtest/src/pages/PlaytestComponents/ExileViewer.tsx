// src/pages/PlaytestComponents/ExileViewer.tsx (ZMODYFIKOWANY)

import { useState, useRef } from "react";
import type { Player } from "../../components/types";
import "./LibraryViewer.css";

interface ExileViewerProps {
 player: Player | undefined; // Nadal używamy 'player', ale teraz to może być przeciwnik
 toggleExileViewer: () => void;
 playerColorClass: string;
 isOwned: boolean; // NOWY PROP
}

export default function ExileViewer({ player, toggleExileViewer, playerColorClass, isOwned }: ExileViewerProps) {
 const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(
  player && player.exile.length > 0 ? player.exile[0].image || null : null
 );
 const [filterText, setFilterText] = useState("");
 const dragImageRef = useRef<HTMLImageElement>(null);

 if (!player) return null;
 
 const canDrag = isOwned; // Tylko właściciel może przeciągać z Exile

 return (
  <div className={`library-viewer-overlay ${playerColorClass}`}>
   <div className="library-viewer-container">
    <div className="library-viewer-header">
     <span>Viewing Exile ({player.exile.length})</span>
     <button onClick={toggleExileViewer}>Close</button>
    </div>
    <div className="library-viewer-content">
     <div className="card-image-preview">
      {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
     </div>

     <ul className="card-list">
      {player.exile.map((card) => (
       <li
        key={card.id}
        draggable={canDrag} // Przeciąganie tylko jeśli jesteś właścicielem
        onDragStart={(e) => {
         if (!canDrag) {
          e.preventDefault();
          return;
         }
         e.dataTransfer.setData("cardId", card.id);
         e.dataTransfer.setData("from", "exile"); 

         if (dragImageRef.current && card.image) {
          dragImageRef.current.src = card.image;
          e.dataTransfer.setDragImage(dragImageRef.current, 50, 70);
         } else {
          e.dataTransfer.setDragImage(new Image(), 0, 0);
         }
        }}
        onMouseEnter={() => setHoveredCardImage(card.image || null)}
        className={!canDrag ? 'read-only-card' : ''}
       >
        {card.name}
       </li>
      ))}
     </ul>
    </div>
    <div className="library-viewer-filter">
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