// src/pages/PlaytestComponents/LibraryViewer.tsx

import React, { useState, useRef } from "react"; // Dodano useRef
import type { Player } from "../../components/types";
import "./LibraryViewer.css";

interface LibraryViewerProps {
  player: Player | undefined;
  toggleLibraryViewer: () => void;
  playerColorClass: string;
}

export default function LibraryViewer({ player, toggleLibraryViewer, playerColorClass }: LibraryViewerProps) {
  const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(
    player && player.library.length > 0 ? player.library[0].image || null : null
  );
  const [filterText, setFilterText] = useState("");
  // Nowy ref dla obrazu do przeciągania
  const dragImageRef = useRef<HTMLImageElement>(null);

  if (!player) return null;

  return (
    <div className={`library-viewer-overlay ${playerColorClass}`}>
      <div className="library-viewer-container">
        <div className="library-viewer-header">
          <span>Viewing Library ({player.library.length})</span>
          <button onClick={toggleLibraryViewer}>Close</button>
        </div>
        <div className="library-viewer-content">
          <div className="card-image-preview">
            {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
          </div>
          
          <ul className="card-list">
            {player.library.map((card) => (
              <li
                key={card.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("cardId", card.id);
                  e.dataTransfer.setData("from", "library");

                  // Ustaw src ukrytego obrazu i użyj go jako obrazu do przeciągania
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
      {/* Dodaj ukryty obraz do przeciągania */}
      <img ref={dragImageRef} className="drag-image-placeholder" alt="Drag Placeholder" />
      </div>
    </div>
  );
}