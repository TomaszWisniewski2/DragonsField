// src/pages/PlaytestComponents/GraveyardViewer.tsx

import { useState, useRef } from "react"; // Dodano useRef
import type { Player } from "../../components/types";
import "./LibraryViewer.css";

interface GraveyardViewerProps {
  player: Player | undefined;
  toggleGraveyardViewer: () => void;
  // Dodajemy propa na klasę koloru, aby stylizować podgląd
  playerColorClass: string; 
}

export default function GraveyardViewer({ player, toggleGraveyardViewer, playerColorClass }: GraveyardViewerProps) {
  const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(
    player && player.graveyard.length > 0 ? player.graveyard[0].image || null : null
  );
  const [filterText, setFilterText] = useState("");
  const dragImageRef = useRef<HTMLImageElement>(null); // Nowy ref dla obrazu

  if (!player) return null;

  return (
    <div className={`library-viewer-overlay ${playerColorClass}`}> {/* Dodaj klasę koloru */}
      <div className="library-viewer-container">
        <div className="library-viewer-header">
          <span>Viewing Graveyard ({player.graveyard.length})</span>
          <button onClick={toggleGraveyardViewer}>Close</button>
        </div>
        <div className="library-viewer-content">
          <div className="card-image-preview">
            {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
          </div>
          
          <ul className="card-list">
            {player.graveyard.map((card) => (
              <li
                key={card.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("cardId", card.id);
                  e.dataTransfer.setData("from", "graveyard"); // Ważne: Zmiana na "graveyard"

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
          <input 
            type="text" 
            placeholder="Filter" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)} 
          />
        </div>
      </div>
       {/* Dodaj ukryty obraz do przeciągania */}
      <img ref={dragImageRef} className="drag-image-placeholder" alt="Drag Placeholder" />
    </div>
  );
}