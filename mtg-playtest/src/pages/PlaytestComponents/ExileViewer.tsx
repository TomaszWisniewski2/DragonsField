// src/pages/PlaytestComponents/ExileViewer.tsx

import { useState, useRef } from "react"; // Dodano useRef
import type { Player } from "../../components/types";
import "./LibraryViewer.css";

interface ExileViewerProps {
  player: Player | undefined;
  toggleExileViewer: () => void;
  // Dodajemy propa na klasę koloru, aby stylizować podgląd
  playerColorClass: string;
}

export default function ExileViewer({ player, toggleExileViewer, playerColorClass }: ExileViewerProps) {
  const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(
    player && player.exile.length > 0 ? player.exile[0].image || null : null
  );
  const [filterText, setFilterText] = useState("");
  const dragImageRef = useRef<HTMLImageElement>(null); // Nowy ref dla obrazu

  if (!player) return null;

  return (
    <div className={`library-viewer-overlay ${playerColorClass}`}> {/* Dodaj klasę koloru */}
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
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("cardId", card.id);
                  e.dataTransfer.setData("from", "exile"); // Ważne: Zmiana na "exile"

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