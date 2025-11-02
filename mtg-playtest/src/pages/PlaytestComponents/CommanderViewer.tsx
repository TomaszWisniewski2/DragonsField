// src/pages/PlaytestComponents/CommanderViewer.tsx

import { useState, useMemo } from "react"; 
import type { Player, CardType } from "../../components/types";
import "./CommanderViewer.css"; 

interface CommanderViewerProps {
 // Gracz, którego Dowódcę oglądamy
 player: Player | undefined; 
 // Funkcja zamykająca widok
 toggleCommanderViewer: () => void;
 // Klasa koloru dla stylizacji
 playerColorClass: string;
}

export default function CommanderViewer({ player, toggleCommanderViewer, playerColorClass }: CommanderViewerProps) {
    
  // --- KROK 1: HOOKI MUSZĄ BYĆ NA GÓRZE ---
  
  // Logika Obliczania Kart Dowódcy (USEMEMO)
  // Używamy useMemo, aby obliczyć listę na podstawie propa player.commanders.
  const commanderCards: CardType[] = useMemo(() => {
    // Musimy sprawdzić, czy player istnieje wewnątrz useMemo, 
    // aby bezpiecznie uzyskać dostęp do player.commanders
    if (!player || !player.commanders) return [];
    
    const commanders = player.commanders;
    if (Array.isArray(commanders)) {
      return commanders;
    }
    return [commanders];
  }, [player]); // Zmieniamy zależność na player?.commanders
  
  // Stan Komponentu (USESTATE)
  // Inicjalizacja stanu: obrazek pierwszej karty Dowódcy lub null
  const initialImage = commanderCards.length > 0 ? commanderCards[0].image || null : null;
  const [hoveredCardImage, setHoveredCardImage] = useState<string | null>(initialImage);
  
  // === KROK 2: TERAZ MOŻEMY UŻYĆ WCZESNEGO ZWROTU ===
  // Upewniamy się, że gracz istnieje, aby renderować interfejs
  if (!player) return null;


  return (
    <div className={`commander-viewer-overlay ${playerColorClass}`}>
     <div className="commander-viewer-container">

      <div className="commander-viewer-header">
       <span>Commander Zone ({commanderCards.length})</span>
       <button onClick={toggleCommanderViewer}>Close</button>
      </div>

      <div className="commander-viewer-content">
       <div className="commander-card-image-preview">
        {hoveredCardImage && <img src={hoveredCardImage} alt="Card Preview" />}
       </div>

       <ul className="commander-card-list"> 
         {commanderCards
          .map((card) => (
           <li
            key={card.id}
            onMouseEnter={() => setHoveredCardImage(card.image || null)}
           >
            {card.name}
           </li>
          ))}
       </ul>
      </div>
     </div>
    </div>
  );
}